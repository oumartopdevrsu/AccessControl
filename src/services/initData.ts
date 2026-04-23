import Realm from 'realm';
import { DIRECTIONS } from '../constants/directions';
import { getRealm } from '../database/realm';

export const initLocalData = async () => {
  const realm = await getRealm();

  realm.write(() => {
    DIRECTIONS.forEach(item => {
      realm.create('ServiceDirection', item, Realm.UpdateMode.Modified);
    });

    const admin = realm.objectForPrimaryKey('User', 'admin');
    if (!admin) {
      realm.create('User', {
        nom: 'Admin',
        prenom: 'Local',
        username: 'admin',
        password: 'admin',
      });
    }
  });

  realm.close();
};

export const initDirections = initLocalData;
