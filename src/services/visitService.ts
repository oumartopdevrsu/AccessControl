import { getRealm } from '../database/realm';
import { Visit, VisitForm } from '../types/domain';
import { formatLocalDate, formatTime } from '../utils/date';
import { copyRealmObject } from '../utils/realm';

export const getVisits = async () => {
  const realm = await getRealm();
  const visits = Array.from(
    realm.objects('Visit').sorted([['date', true], ['heureEntree', true]]),
  )
    .map(item => copyRealmObject<Visit>(item));

  realm.close();
  return visits;
};

export const createVisit = async (form: VisitForm) => {
  const now = new Date();
  const realm = await getRealm();

  realm.write(() => {
    realm.create('Visit', {
      id: `${now.getTime()}`,
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
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

  realm.close();
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

  realm.close();
};

export const syncVisitsEndOfDay = async () => {
  const realm = await getRealm();
  const unsyncedVisits = Array.from(
    realm.objects('Visit').filtered('synced == false'),
  );
  const syncedCount = unsyncedVisits.length;

  realm.write(() => {
    unsyncedVisits.forEach(visit => {
      (visit as unknown as {synced: boolean}).synced = true;
      realm.delete(visit);
    });
  });

  realm.close();
  return syncedCount;
};
