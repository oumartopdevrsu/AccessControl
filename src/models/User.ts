import Realm from 'realm';

export const UserSchema: Realm.ObjectSchema = {
  name: 'User',
  primaryKey: 'username',
  properties: {
    nom: 'string',
    prenom: 'string',
    username: 'string',
    password: 'string',
  },
};
