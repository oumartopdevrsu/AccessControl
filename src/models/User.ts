export const UserSchema = {
  name: 'User',
  primaryKey: 'username',
  properties: {
    nom: 'string',
    prenom: 'string',
    username: 'string',
    password: 'string',
  },
};