import Realm from 'realm';
import { ServiceDirectionSchema } from '../models/ServiceDirection';
import { UserSchema } from '../models/User';
import { VisitSchema } from '../models/Visit';

export const getRealm = async () => {
  return await Realm.open({
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
          (visit as unknown as {dateNaissance: string | null}).dateNaissance =
            null;
        });
      }
    },
  });
};
