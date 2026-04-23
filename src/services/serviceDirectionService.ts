import Realm from 'realm';
import {getRealm} from '../database/realm';
import {ServiceDirection} from '../types/domain';
import {copyRealmObject} from '../utils/realm';
import {apiRequest} from './api';
import {getCurrentUser} from './userService';

type BackendServiceDirection = {
  id: number;
  code: string;
  libelle: string;
  active?: boolean;
};

export const getServiceDirections = async () => {
  const realm = await getRealm();
  const directions = Array.from(
    realm.objects('ServiceDirection').sorted('libelle'),
  ).map(item => copyRealmObject<ServiceDirection>(item));

  return directions;
};

export const syncServiceDirectionsFromBackend = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser?.token) {
    throw new Error(
      'Connecte-toi au serveur avant de charger les services depuis le backend.',
    );
  }

  const remoteServices = await apiRequest<BackendServiceDirection[]>(
    '/api/services/active',
    {
      token: currentUser.token,
    },
  );

  const realm = await getRealm();

  realm.write(() => {
    remoteServices.forEach(item => {
      realm.create(
        'ServiceDirection',
        {
          code: item.code,
          libelle: item.libelle,
          serverId: item.id,
          active: item.active ?? true,
        },
        Realm.UpdateMode.Modified,
      );
    });
  });

  return remoteServices.length;
};
