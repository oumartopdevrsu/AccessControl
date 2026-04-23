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
import { initLocalData } from './src/services/initData';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [loading, setLoading] = useState(true);

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

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {loading ? (
        <SafeAreaView style={styles.loading}>
          <ActivityIndicator />
          <Text style={styles.mutedText}>Chargement des donnees locales...</Text>
        </SafeAreaView>
      ) : (
        <AppNavigator />
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
});

export default App;
