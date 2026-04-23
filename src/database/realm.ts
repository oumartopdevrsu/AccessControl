import Realm from 'realm';
import { ServiceDirectionSchema } from '../models/ServiceDirection';
import { UserSchema } from '../models/User';
import { VisitSchema } from '../models/Visit';

const realmConfig: Realm.Configuration = {
  path: 'accesscontrol.realm',
  schema: [ServiceDirectionSchema, UserSchema, VisitSchema],
  schemaVersion: 3,
  onMigration: (oldRealm: Realm, newRealm: Realm) => {
    if (oldRealm.schemaVersion < 2) {
      const visits = newRealm.objects('Visit');
      visits.forEach((visit: Realm.Object) => {
        (visit as unknown as {synced: boolean}).synced = false;
      });
    }
    if (oldRealm.schemaVersion < 3) {
      const visits = newRealm.objects('Visit');
      visits.forEach((visit: Realm.Object) => {
        (visit as unknown as {dateDelivrance: string | null}).dateDelivrance =
          null;
      });
    }
  },
};

export const getRealm = async () => {
  try {
    return await Realm.open(realmConfig);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (__DEV__ && message.includes('Migration is required')) {
      Realm.deleteFile(realmConfig);
      return await Realm.open(realmConfig);
    }

    throw error;
  }
};
