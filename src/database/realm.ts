import Realm from 'realm';
import { ServiceDirectionSchema } from '../models/ServiceDirection';

export const getRealm = async () => {
  return await Realm.open({
    path: 'accesscontrol.realm',
    schema: [ServiceDirectionSchema],
    schemaVersion: 1,
  });
};