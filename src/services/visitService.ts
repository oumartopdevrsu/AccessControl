import Realm from 'realm';
import {getRealm} from '../database/realm';
import {Visit, VisitForm} from '../types/domain';
import {formatLocalDate, formatTime} from '../utils/date';
import {copyRealmObject} from '../utils/realm';
import {apiRequest} from './api';
import {syncServiceDirectionsFromBackend} from './serviceDirectionService';
import {getCurrentUser} from './userService';

type SyncPayloadItem = {
  nom: string;
  prenom: string;
  genre: 'M' | 'F';
  numeroDocument: string;
  date: string;
  heureEntree: string;
  heureSortie?: string;
  motif?: string;
  serviceId: number;
  contact?: string;
  mobileRef: string;
};

type SyncItemResult = {
  mobileRef: string;
  serverId?: number | null;
  status: 'created' | 'duplicate' | 'error';
  message?: string;
};

type BulkSyncResponse = {
  total: number;
  created: number;
  duplicates: number;
  failed: number;
  results: SyncItemResult[];
};

const normalizeBackendTime = (value?: string | null) => {
  if (!value) {
    return undefined;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{2}:\d{2}$/.test(value)) {
    return `${value}:00`;
  }

  return value;
};

export const getVisits = async () => {
  const realm = await getRealm();
  const visits = Array.from(
    realm.objects('Visit').sorted([['date', true], ['heureEntree', true]]),
  ).map(item => copyRealmObject<Visit>(item));

  return visits;
};

export const createVisit = async (form: VisitForm) => {
  const now = new Date();
  const id = `${now.getTime()}`;
  const realm = await getRealm();

  realm.write(() => {
    realm.create('Visit', {
      id,
      mobileRef: id,
      serverId: null,
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      genre: form.genre,
      dateDelivrance: form.dateDelivrance.trim(),
      numeroDocument: form.numeroDocument.trim(),
      contact: form.contact.trim(),
      motif: form.motif.trim() || null,
      codeServiceDirection: form.codeServiceDirection,
      date: formatLocalDate(now),
      heureEntree: formatTime(now),
      heureSortie: null,
      synced: false,
    });
  });
};

export const closeVisit = async (visitId: string) => {
  const realm = await getRealm();
  const visit = realm.objectForPrimaryKey('Visit', visitId);

  if (visit) {
    realm.write(() => {
      (visit as unknown as {heureSortie: string}).heureSortie = formatTime(
        new Date(),
      );
    });
  }
};

const buildSyncPayload = async (visitIds: string[]): Promise<SyncPayloadItem[]> => {
  const realm = await getRealm();
  const visits = visitIds
    .map(id => realm.objectForPrimaryKey('Visit', id))
    .filter(Boolean) as Realm.Object[];

  return visits.map(item => {
    const visit = copyRealmObject<Visit>(item);
    const service = realm.objectForPrimaryKey(
      'ServiceDirection',
      visit.codeServiceDirection,
    );
    const serverId = (service as unknown as {serverId?: number | null})
      ?.serverId;

    if (!serverId) {
      throw new Error(
        `Le service ${visit.codeServiceDirection} n'est pas disponible cote backend pour la synchronisation.`,
      );
    }

    return {
      nom: visit.nom,
      prenom: visit.prenom,
      genre: visit.genre,
      numeroDocument: visit.numeroDocument,
      date: visit.date,
      heureEntree: normalizeBackendTime(visit.heureEntree) || visit.heureEntree,
      heureSortie: normalizeBackendTime(visit.heureSortie),
      motif: visit.motif || undefined,
      serviceId: serverId,
      contact: visit.contact || undefined,
      mobileRef: visit.mobileRef,
    };
  });
};

export const syncSelectedVisits = async (visitIds: string[]) => {
  if (visitIds.length === 0) {
    return {
      total: 0,
      created: 0,
      duplicates: 0,
      failed: 0,
      results: [] as SyncItemResult[],
    };
  }

  const currentUser = await getCurrentUser();

  if (!currentUser?.token) {
    throw new Error(
      'Connecte-toi au serveur avant de synchroniser des visites.',
    );
  }

  let payload: SyncPayloadItem[];

  try {
    payload = await buildSyncPayload(visitIds);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("n'est pas disponible cote backend")) {
      await syncServiceDirectionsFromBackend();

      try {
        payload = await buildSyncPayload(visitIds);
      } catch (retryError) {
        const retryMessage =
          retryError instanceof Error ? retryError.message : String(retryError);

        if (retryMessage.includes("n'est pas disponible cote backend")) {
          throw new Error(
            'Au moins un service local ne correspond a aucun service actif sur le backend. Recharge les services puis recree la visite avec un service backend valide.',
          );
        }

        throw retryError;
      }
    } else {
      throw error;
    }
  }

  const response = await apiRequest<BulkSyncResponse>('/api/sync/visites', {
    method: 'POST',
    token: currentUser.token,
    body: payload,
  });

  const successfulMobileRefs = response.results
    .filter(item => item.status === 'created' || item.status === 'duplicate')
    .map(item => item.mobileRef);

  if (successfulMobileRefs.length > 0) {
    const realm = await getRealm();

    realm.write(() => {
      successfulMobileRefs.forEach(mobileRef => {
        const visit = realm
          .objects('Visit')
          .filtered('mobileRef == $0', mobileRef)[0];
        if (visit) {
          realm.delete(visit);
        }
      });
    });
  }

  return response;
};
