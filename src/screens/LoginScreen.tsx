/**
 * Écran de connexion.
 *
 * Stratégie d'authentification :
 *  1. Tente la connexion via le backend (token JWT).
 *  2. En cas d'échec réseau, bascule sur l'authentification locale (Realm).
 *
 * Aucune logique d'authentification ici — tout est délégué au parent (App.tsx)
 * via le callback onSubmit.
 */

import React, {useState} from 'react';
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
import {Colors, FontSize, Radius, Shadows, Spacing} from '../theme';

type Props = {
  /** Indicateur de chargement pendant la requête de connexion */
  loading?: boolean;
  /** Appelé quand l'utilisateur soumet le formulaire */
  onSubmit: (username: string, password: string) => Promise<void>;
};

export function LoginScreen({loading = false, onSubmit}: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView
      style={styles.shell}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* ── En-tête coloré avec logo RSU ── */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Image
              source={require('../assets/images/rsu-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.appTitle}>Registre Social Unique</Text>
          <Text style={styles.appSubtitle}>Contrôle d'Accès</Text>

          {/* Mini-drapeau Burkina Faso (rouge / vert) */}
          <View style={styles.flagBand}>
            <View style={[styles.flagStripe, {backgroundColor: Colors.flagRed}]} />
            <View style={[styles.flagStripe, {backgroundColor: Colors.flagGreen}]} />
          </View>
        </View>

        {/* ── Carte formulaire de connexion ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connexion</Text>
          <Text style={styles.cardSubtitle}>
            Identifie-toi pour accéder à l'application.
          </Text>

          <View style={styles.form}>
            {/* Champ nom d'utilisateur */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nom d'utilisateur</Text>
              <TextInput
                style={styles.input}
                value={username}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setUsername}
                placeholder="admin"
                placeholderTextColor={Colors.textMuted}
                returnKeyType="next"
              />
            </View>

            {/* Champ mot de passe */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                value={password}
                secureTextEntry
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                returnKeyType="done"
                onSubmitEditing={() => onSubmit(username, password)}
              />
            </View>

            {/* Bouton de connexion */}
            <Pressable
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              disabled={loading}
              onPress={() => onSubmit(username, password)}>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.textOnPrimary} />
              ) : (
                <Text style={styles.loginBtnText}>Se connecter</Text>
              )}
            </Pressable>
          </View>

          {/* Information sur le mode hors ligne 
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ℹ  Mode hors ligne</Text>
            <Text style={styles.infoText}>
              Première connexion : le compte doit exister sur le backend.
            </Text>
            <Text style={styles.infoText}>
              Les connexions suivantes fonctionnent sans réseau.
            </Text>
          </View>*/}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
  },

  // ── En-tête bleu marine avec logo ──────────────────────────────────────────
  header: {
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl + Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  logoWrap: {
    width: 144,
    height: 144,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    ...Shadows.lg,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appTitle: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  appSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: FontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Mini-drapeau décoratif
  flagBand: {
    flexDirection: 'row',
    width: 44,
    height: 5,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  flagStripe: {
    flex: 1,
  },

  // ── Carte formulaire ────────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.surface,
    // Chevauchement avec l'en-tête pour un effet de feuille
    borderTopLeftRadius:  Radius.xl,
    borderTopRightRadius: Radius.xl,
    marginTop: -Radius.xl,
    flex: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
    ...Shadows.lg,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: -Spacing.md,
  },

  // ── Formulaire ──────────────────────────────────────────────────────────────
  form: {
    gap: Spacing.md,
  },
  fieldGroup: {
    gap: Spacing.xs,
  },
  label: {
    color: Colors.navy,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
  },
  loginBtn: {
    height: 54,
    marginTop: Spacing.xs,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    ...Shadows.md,
  },
  loginBtnDisabled: {
    opacity: 0.70,
  },
  loginBtnText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.md,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  // ── Note informative ────────────────────────────────────────────────────────
  infoBox: {
    borderRadius: Radius.md,
    backgroundColor: Colors.infoBg,
    borderWidth: 1,
    borderColor: Colors.infoBorder,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  infoTitle: {
    color: Colors.info,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 17,
  },
});
