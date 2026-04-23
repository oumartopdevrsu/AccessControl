import { getRealm } from '../database/realm';

export type AuthUser = {
  nom: string;
  prenom: string;
  username: string;
};

export const authenticateUser = async (
  username: string,
  password: string,
): Promise<AuthUser | null> => {
  const realm = await getRealm();
  const user = realm.objectForPrimaryKey('User', username.trim());

  if (
    !user ||
    (user as unknown as {password: string}).password !== password.trim()
  ) {
    realm.close();
    return null;
  }

  const result = {
    nom: (user as unknown as {nom: string}).nom,
    prenom: (user as unknown as {prenom: string}).prenom,
    username: (user as unknown as {username: string}).username,
  };

  realm.close();
  return result;
};
