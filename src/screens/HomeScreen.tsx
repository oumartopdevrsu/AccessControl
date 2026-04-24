/**
 * Écran d'accueil (tableau de bord).
 *
 * Fonctionnalités :
 *  - Raccourcis vers les deux actions principales (Nouvelle visite / Historique).
 *  - Bouton de chargement des services depuis le backend.
 *  - Affichage de l'URL du backend configuré.
 */

import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {RootTabParamList} from '../navigation/AppNavigator';
import {getApiBaseUrl} from '../services/api';
import {syncServiceDirectionsFromBackend} from '../services/serviceDirectionService';
import {Colors, FontSize, Radius, Shadows, Spacing} from '../theme';

type Props = BottomTabScreenProps<RootTabParamList, 'Home'>;

export function HomeScreen({navigation}: Props) {
  const [loadingServices, setLoadingServices] = useState(false);

  /** Charge les services/directions depuis le backend et les sauvegarde en local */
  const handleSyncServices = async () => {
    try {
      setLoadingServices(true);
      const total = await syncServiceDirectionsFromBackend();
      Alert.alert(
        'Services chargés',
        `${total} service(s) ou direction(s) récupérés depuis le backend.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erreur de synchronisation.';
      Alert.alert('Chargement des services', message);
    } finally {
      setLoadingServices(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* ── Bannière de bienvenue ── */}
      <View style={styles.banner}>
        <Text style={styles.bannerEyebrow}>RSU — Contrôle d'Accès</Text>
        <Text style={styles.bannerTitle}>Bienvenue</Text>
        <Text style={styles.bannerSubtitle}>
          Gérez les visites, scannez les CNIB et synchronisez les données.
        </Text>
      </View>

      {/* ── Actions rapides ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Actions rapides</Text>

        {/* Carte Nouvelle Visite (fond bleu primaire) */}
        <Pressable
          style={[styles.actionCard, styles.actionCardPrimary]}
          onPress={() => navigation.navigate('NewVisit')}>
          <View style={styles.actionIcon}>
            <Text style={styles.actionIconText}>⊕</Text>
          </View>
          <View style={styles.actionBody}>
            <Text style={styles.actionTitleLight}>Nouvelle visite</Text>
            <Text style={styles.actionDescLight}>
              Enregistrer une entrée avec scan CNIB
            </Text>
          </View>
          <Text style={styles.actionArrowLight}>›</Text>
        </Pressable>

        {/* Carte Historique (fond blanc avec bordure) */}
        <Pressable
          style={[styles.actionCard, styles.actionCardSecondary]}
          onPress={() => navigation.navigate('History')}>
          <View style={[styles.actionIcon, styles.actionIconOutline]}>
            <Text style={[styles.actionIconText, {color: Colors.primary}]}>☰</Text>
          </View>
          <View style={styles.actionBody}>
            <Text style={styles.actionTitleDark}>Historique des visites</Text>
            <Text style={styles.actionDescDark}>
              Filtrer, modifier et synchroniser
            </Text>
          </View>
          <Text style={styles.actionArrowDark}>›</Text>
        </Pressable>
      </View>

      {/* ── Configuration backend ── */}
      <View style={styles.section}>
       {
        /* <Text style={styles.sectionLabel}>Backend</Text>
        <View style={styles.backendRow}>
            <View style={styles.statusDot} />
            <Text style={styles.backendUrl} numberOfLines={1}>
              {getApiBaseUrl()}
            </Text>
          </View>
        */
       } 

        <View style={styles.backendCard}>
          {/* URL du serveur avec indicateur de connexion */}
          

          {/* Chargement des services depuis le backend */}
          <Pressable
            style={[styles.syncBtn, loadingServices && styles.syncBtnDisabled]}
            disabled={loadingServices}
            onPress={handleSyncServices}>
            {loadingServices ? (
              <ActivityIndicator size="small" color={Colors.textOnPrimary} />
            ) : (
              <Text style={styles.syncBtnText}>Charger les services</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* ── Note mode hors ligne ── */}
      <View style={styles.infoNote}>
        <Text style={styles.infoNoteText}>
          Les données sont stockées localement et synchronisées manuellement
          depuis l'écran Historique.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },

  // ── Bannière ───────────────────────────────────────────────────────────────
  banner: {
    backgroundColor: Colors.primaryDark,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.xs,
    ...Shadows.md,
  },
  bannerEyebrow: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bannerTitle: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.h1,
    fontWeight: '800',
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  // ── Sections ───────────────────────────────────────────────────────────────
  section: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.xs,
  },

  // ── Cartes d'action ────────────────────────────────────────────────────────
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  actionCardPrimary: {
    backgroundColor: Colors.primary,
  },
  actionCardSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconOutline: {
    backgroundColor: Colors.primaryFaint,
  },
  actionIconText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textOnPrimary,
  },
  actionBody: {
    flex: 1,
    gap: 3,
  },
  actionTitleLight: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  actionTitleDark: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  actionDescLight: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: FontSize.sm,
  },
  actionDescDark: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  actionArrowLight: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 26,
  },
  actionArrowDark: {
    color: Colors.textMuted,
    fontSize: 26,
  },

  // ── Carte backend ──────────────────────────────────────────────────────────
  backendCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  backendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  // Pastille verte indiquant la configuration du serveur
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.flagGreen,
  },
  backendUrl: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  syncBtn: {
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  syncBtnDisabled: {
    opacity: 0.65,
  },
  syncBtnText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },

  // ── Note hors ligne ────────────────────────────────────────────────────────
  infoNote: {
    borderRadius: Radius.md,
    backgroundColor: Colors.infoBg,
    borderWidth: 1,
    borderColor: Colors.infoBorder,
    padding: Spacing.md,
  },
  infoNoteText: {
    color: Colors.info,
    fontSize: FontSize.sm,
    lineHeight: 19,
  },
});
