import Realm from 'realm';

export const UserSchema: Realm.ObjectSchema = {
  name: 'User',
  primaryKey: 'username',
  properties: {
    nom: 'string',
    prenom: 'string',
    username: 'string',
    password: 'string?',
    contact: 'string?',
    role: 'string?',
    token: 'string?',
    tokenType: 'string?',
    expiresIn: 'int?',
    isCurrent: {type: 'bool', default: false},
    lastLoginAt: 'date?',
  },
};
