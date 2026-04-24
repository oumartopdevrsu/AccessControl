/**
 * Point d'entrée principal de l'application RSU AccessControl.
 *
 * Responsabilités :
 *  1. Initialise la base Realm locale au démarrage (initLocalData).
 *  2. Gère l'état d'authentification : connexion / déconnexion.
 *  3. Redirige vers LoginScreen ou AppNavigator selon l'état.
 */

import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {AppNavigator} from './src/navigation/AppNavigator';
import {LoginScreen} from './src/screens/LoginScreen';
import {initLocalData} from './src/services/initData';
import {
  AuthUser,
  authenticateUser,
  clearCurrentUser,
} from './src/services/userService';
import {Colors, FontSize, Spacing} from './src/theme';

function App() {
  // true pendant l'initialisation Realm au lancement
  const [loading, setLoading] = useState(true);
  // true pendant la requête de connexion
  const [authLoading, setAuthLoading] = useState(false);
  // null = non connecté, AuthUser = connecté
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Initialise les données locales (Realm + directions par défaut)
  useEffect(() => {
    const bootstrap = async () => {
      try {
        await initLocalData();
      } catch (error) {
        Alert.alert('Erreur', "Impossible d'initialiser les données locales.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  // Tente d'authentifier via backend puis en local (mode hors ligne)
  const handleLogin = async (username: string, password: string) => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Connexion', "Saisis le nom d'utilisateur et le mot de passe.");
      return;
    }
    try {
      setAuthLoading(true);
      const user = await authenticateUser(username, password);
      if (!user) {
        Alert.alert('Connexion', 'Identifiants invalides.');
        return;
      }
      setCurrentUser(user);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Impossible de vérifier le compte local.';
      Alert.alert('Connexion', message);
      console.error(error);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      {/* Barre de statut blanche sur fond bleu RSU */}
      <StatusBar backgroundColor={Colors.primaryDark} barStyle="light-content" />

      {loading ? (
        /* Écran de démarrage avec logo RSU */
        <SafeAreaView style={styles.loadingShell}>
          <Image
            source={require('./src/assets/images/rsu-logo.png')}
            style={styles.loadingLogo}
            resizeMode="contain"
          />
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={styles.loadingSpinner}
          />
          <Text style={styles.loadingText}>Initialisation…</Text>
        </SafeAreaView>
      ) : !currentUser ? (
        /* Écran de connexion */
        <SafeAreaView style={styles.authShell}>
          <LoginScreen loading={authLoading} onSubmit={handleLogin} />
        </SafeAreaView>
      ) : (
        /* Application principale */
        <AppNavigator
          onLogout={async () => {
            await clearCurrentUser();
            setCurrentUser(null);
          }}
        />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.md,
  },
  loadingLogo: {
    width: 150,
    height: 150,
  },
  loadingSpinner: {
    marginTop: Spacing.sm,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  authShell: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default App;
