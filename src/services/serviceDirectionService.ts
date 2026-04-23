import { getRealm } from '../database/realm';
import { ServiceDirection } from '../types/domain';
import { copyRealmObject } from '../utils/realm';

export const getServiceDirections = async () => {
  const realm = await getRealm();
  const directions = Array.from(realm.objects('ServiceDirection').sorted('libelle'))
    .map(item => copyRealmObject<ServiceDirection>(item));

  realm.close();
  return directions;
};
