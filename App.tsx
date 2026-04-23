import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LoginScreen } from './src/screens/LoginScreen';
import { initLocalData } from './src/services/initData';
import { AuthUser, authenticateUser } from './src/services/userService';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await initLocalData();
      } catch (error) {
        Alert.alert('Erreur', "Impossible d'initialiser les donnees locales.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

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
      Alert.alert('Connexion', 'Impossible de verifier le compte local.');
      console.error(error);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {loading ? (
        <SafeAreaView style={styles.loading}>
          <ActivityIndicator />
          <Text style={styles.mutedText}>Chargement des donnees locales...</Text>
        </SafeAreaView>
      ) : !currentUser ? (
        <SafeAreaView style={styles.authShell}>
          <LoginScreen loading={authLoading} onSubmit={handleLogin} />
        </SafeAreaView>
      ) : (
        <AppNavigator onLogout={() => setCurrentUser(null)} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#f6f7f9',
  },
  mutedText: {
    color: '#6b7280',
  },
  authShell: {
    flex: 1,
  },
});

export default App;
