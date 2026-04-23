import Realm from 'realm';
import {ServiceDirectionSchema} from '../models/ServiceDirection';
import {UserSchema} from '../models/User';
import {VisitSchema} from '../models/Visit';

const realmConfig: Realm.Configuration = {
  path: 'accesscontrol.realm',
  schema: [ServiceDirectionSchema, UserSchema, VisitSchema],
  schemaVersion: 6,
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

    if (oldRealm.schemaVersion < 4) {
      const services = newRealm.objects('ServiceDirection');
      services.forEach((service: Realm.Object) => {
        (service as unknown as {serverId: number | null}).serverId = null;
        (service as unknown as {active: boolean}).active = true;
      });

      const users = newRealm.objects('User');
      users.forEach((user: Realm.Object) => {
        (user as unknown as {contact: string | null}).contact = null;
        (user as unknown as {role: string | null}).role = null;
        (user as unknown as {token: string | null}).token = null;
        (user as unknown as {tokenType: string | null}).tokenType = null;
        (user as unknown as {expiresIn: number | null}).expiresIn = null;
        (user as unknown as {isCurrent: boolean}).isCurrent = false;
        (user as unknown as {lastLoginAt: Date | null}).lastLoginAt = null;
      });
    }

    if (oldRealm.schemaVersion < 5) {
      const visits = newRealm.objects('Visit');
      visits.forEach((visit: Realm.Object) => {
        const id = (visit as unknown as {id: string}).id;
        (visit as unknown as {mobileRef: string}).mobileRef = id;
        (visit as unknown as {serverId: number | null}).serverId = null;
      });
    }

    if (oldRealm.schemaVersion < 6) {
      const visits = newRealm.objects('Visit');
      visits.forEach((visit: Realm.Object) => {
        (visit as unknown as {genre: string}).genre = 'M';
      });
    }
  },
};

let realmInstance: Realm | null = null;
let realmOpeningPromise: Promise<Realm> | null = null;

const resetRealmState = () => {
  realmInstance = null;
  realmOpeningPromise = null;
};

const openRealm = async () => {
  if (realmInstance && !realmInstance.isClosed) {
    return realmInstance;
  }

  if (realmOpeningPromise) {
    return realmOpeningPromise;
  }

  realmOpeningPromise = Realm.open(realmConfig)
    .then(openedRealm => {
      realmInstance = openedRealm;
      realmOpeningPromise = null;
      return openedRealm;
    })
    .catch(error => {
      resetRealmState();
      throw error;
    });

  return realmOpeningPromise;
};

export const getRealm = async () => {
  try {
    return await openRealm();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (
      __DEV__ &&
      message.includes('already opened with different schema version')
    ) {
      Realm.shutdown();
      resetRealmState();
      return openRealm();
    }

    if (__DEV__ && message.includes('Migration is required')) {
      Realm.shutdown();
      resetRealmState();
      Realm.deleteFile(realmConfig);
      return openRealm();
    }

    throw error;
  }
};

export const closeRealmInstance = () => {
  if (realmInstance && !realmInstance.isClosed) {
    realmInstance.close();
  }
  resetRealmState();
};
