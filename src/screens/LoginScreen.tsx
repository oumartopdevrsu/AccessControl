import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Props = {
  loading?: boolean;
  onSubmit: (username: string, password: string) => Promise<void>;
};

export function LoginScreen({loading = false, onSubmit}: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView
      style={styles.keyboardShell}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <View style={styles.hero}>
            <View style={styles.logoShell}>
              <Image
                source={require('../assets/images/rsu-logo.jpeg')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>Access Control RSU</Text>
            <Text style={styles.subtitle}>
              Enregistrement et historique des visites
            </Text>
            <Text style={styles.helperCaption}>
              Connexion locale requise avant d&apos;acceder a l&apos;application
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Connexion</Text>
              <Text style={styles.cardText}>
                Saisis ton compte local pour continuer.
              </Text>
            </View>

            <View style={styles.formBody}>
              <Text style={styles.label}>Nom d&apos;utilisateur</Text>
              <TextInput
                style={styles.input}
                value={username}
                autoCapitalize="none"
                onChangeText={setUsername}
                placeholder="admin"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                value={password}
                secureTextEntry
                onChangeText={setPassword}
                placeholder="admin"
                placeholderTextColor="#94a3b8"
              />

              <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                disabled={loading}
                onPress={() => onSubmit(username, password)}>
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Se connecter</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Connexion mobile</Text>
              <Text style={styles.helperText}>
                Premiere connexion: le compte doit exister sur le backend.
              </Text>
              <Text style={styles.helperText}>
                Ensuite, les informations de connexion peuvent etre reutilisees
                hors ligne.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardShell: {
    flex: 1,
    backgroundColor: '#eaf4ff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 28,
    backgroundColor: '#eaf4ff',
    gap: 24,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
    maxWidth: 420,
  },
  logoShell: {
    width: 132,
    height: 132,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fbff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 14,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appName: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#0369a1',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  helperCaption: {
    color: '#475569',
    fontSize: 13,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderRadius: 14,
    backgroundColor: '#f8fbff',
    borderWidth: 1,
    borderColor: '#cfe3ff',
    padding: 16,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHeader: {
    gap: 2,
    marginBottom: 2,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  cardText: {
    color: '#475569',
    fontSize: 12,
  },
  formBody: {
    gap: 12,
  },
  label: {
    color: '#1e3a8a',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    color: '#0f172a',
    paddingHorizontal: 12,
  },
  button: {
    minHeight: 48,
    marginTop: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f766e',
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  infoBox: {
    borderRadius: 12,
    backgroundColor: '#ecfeff',
    borderWidth: 1,
    borderColor: '#99f6e4',
    padding: 12,
    gap: 4,
  },
  infoTitle: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '800',
  },
  helperText: {
    color: '#64748b',
    fontSize: 12,
  },
});
