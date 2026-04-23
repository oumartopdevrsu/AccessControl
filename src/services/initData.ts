import Realm from 'realm';
import {DIRECTIONS} from '../constants/directions';
import {getRealm} from '../database/realm';

export const initLocalData = async () => {
  const realm = await getRealm();

  realm.write(() => {
    if (realm.objects('ServiceDirection').length === 0) {
      DIRECTIONS.forEach(item => {
        realm.create(
          'ServiceDirection',
          {
            ...item,
            serverId: null,
            active: true,
          },
          Realm.UpdateMode.Modified,
        );
      });
    }
  });
};

export const initDirections = initLocalData;
