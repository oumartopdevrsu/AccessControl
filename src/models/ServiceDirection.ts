import Realm from 'realm';

export const ServiceDirectionSchema: Realm.ObjectSchema = {
  name: 'ServiceDirection',
  primaryKey: 'code',
  properties: {
    code: 'string',
    libelle: 'string',
    serverId: 'int?',
    active: {type: 'bool', default: true},
  },
};
