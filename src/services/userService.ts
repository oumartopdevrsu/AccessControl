import Realm from 'realm';
import {getRealm} from '../database/realm';
import {apiRequest, ApiError} from './api';

type LoginResponse = {
  token: string;
  tokenType?: string;
  expiresIn?: number;
  username: string;
  nom: string;
  prenom: string;
  role?: string;
};

export type AuthUser = {
  nom: string;
  prenom: string;
  username: string;
  role?: string | null;
  token?: string | null;
};

const persistAuthenticatedUser = async (
  login: LoginResponse,
  password: string,
): Promise<AuthUser> => {
  const realm = await getRealm();

  realm.write(() => {
    realm.objects('User').forEach(item => {
      (item as unknown as {isCurrent: boolean}).isCurrent = false;
    });

    realm.create(
      'User',
      {
        nom: login.nom,
        prenom: login.prenom,
        username: login.username,
        password,
        contact: null,
        role: login.role || null,
        token: login.token,
        tokenType: login.tokenType || 'Bearer',
        expiresIn: login.expiresIn || null,
        isCurrent: true,
        lastLoginAt: new Date(),
      },
      Realm.UpdateMode.Modified,
    );
  });

  return {
    nom: login.nom,
    prenom: login.prenom,
    username: login.username,
    role: login.role || null,
    token: login.token,
  };
};

const authenticateLocally = async (
  username: string,
  password: string,
): Promise<AuthUser | null> => {
  const realm = await getRealm();
  const user = realm.objectForPrimaryKey('User', username.trim());

  if (
    !user ||
    (user as unknown as {password?: string | null}).password !== password.trim()
  ) {
    return null;
  }

  realm.write(() => {
    realm.objects('User').forEach(item => {
      (item as unknown as {isCurrent: boolean}).isCurrent = false;
    });
    (user as unknown as {isCurrent: boolean}).isCurrent = true;
  });

  const result = {
    nom: (user as unknown as {nom: string}).nom,
    prenom: (user as unknown as {prenom: string}).prenom,
    username: (user as unknown as {username: string}).username,
    role: (user as unknown as {role?: string | null}).role || null,
    token: (user as unknown as {token?: string | null}).token || null,
  };

  return result;
};

export const authenticateUser = async (
  username: string,
  password: string,
): Promise<AuthUser | null> => {
  const cleanedUsername = username.trim();
  const cleanedPassword = password.trim();

  try {
    const response = await apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: {
        username: cleanedUsername,
        password: cleanedPassword,
      },
    });

    return persistAuthenticatedUser(response, cleanedPassword);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    const localUser = await authenticateLocally(cleanedUsername, cleanedPassword);
    if (localUser) {
      return localUser;
    }

    throw new Error(
      'Connexion serveur indisponible. Une premiere connexion reussie en ligne est necessaire pour se reconnecter hors ligne.',
    );
  }
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const realm = await getRealm();
  const currentUser = realm.objects('User').filtered('isCurrent == true')[0];

  if (!currentUser) {
    return null;
  }

  const result = {
    nom: (currentUser as unknown as {nom: string}).nom,
    prenom: (currentUser as unknown as {prenom: string}).prenom,
    username: (currentUser as unknown as {username: string}).username,
    role:
      (currentUser as unknown as {role?: string | null}).role || null,
    token:
      (currentUser as unknown as {token?: string | null}).token || null,
  };

  return result;
};

export const clearCurrentUser = async () => {
  const realm = await getRealm();

  realm.write(() => {
    realm.objects('User').forEach(item => {
      (item as unknown as {isCurrent: boolean}).isCurrent = false;
      (item as unknown as {token?: string | null}).token = null;
      (item as unknown as {tokenType?: string | null}).tokenType = null;
      (item as unknown as {expiresIn?: number | null}).expiresIn = null;
    });
  });
};
