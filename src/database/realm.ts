import Realm from 'realm';
import { ServiceDirectionSchema } from '../models/ServiceDirection';
import { UserSchema } from '../models/User';
import { VisitSchema } from '../models/Visit';

export const getRealm = async () => {
  return await Realm.open({
    path: 'accesscontrol.realm',
    schema: [ServiceDirectionSchema, UserSchema, VisitSchema],
    schemaVersion: 1,
  });
};