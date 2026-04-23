import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {RootTabParamList} from '../navigation/AppNavigator';
import {syncServiceDirectionsFromBackend} from '../services/serviceDirectionService';
import {getApiBaseUrl} from '../services/api';

type Props = BottomTabScreenProps<RootTabParamList, 'Home'>;

export function HomeScreen({navigation}: Props) {
  const [loadingServices, setLoadingServices] = useState(false);

  const handleSyncServices = async () => {
    try {
      setLoadingServices(true);
      const total = await syncServiceDirectionsFromBackend();
      Alert.alert(
        'Services charges',
        `${total} service(s) ou direction(s) ont ete recuperes depuis le backend.`,
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
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Access Control RSU</Text>
        <Text style={styles.title}>Bienvenue</Text>
        <Text style={styles.subtitle}>
          Choisis une action pour commencer la gestion des visites.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.actionCard, styles.primaryCard]}
          onPress={() => navigation.navigate('NewVisit')}>
          <Text style={[styles.cardIcon, styles.primaryCardIcon]}>+</Text>
          <Text style={[styles.cardTitle, styles.primaryCardTitle]}>
            Ajouter une visite
          </Text>
          <Text style={[styles.cardText, styles.primaryCardText]}>
            Enregistrer une nouvelle entree avec scan CNIB et stockage local.
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionCard, styles.secondaryCard]}
          onPress={() => navigation.navigate('History')}>
          <Text style={[styles.cardIcon, styles.secondaryCardIcon]}>H</Text>
          <Text style={[styles.cardTitle, styles.secondaryCardTitle]}>
            Consulter l&apos;historique
          </Text>
          <Text style={[styles.cardText, styles.secondaryCardText]}>
            Retrouver les visites, filtrer par date et choisir celles a
            synchroniser.
          </Text>
        </Pressable>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Backend</Text>
        <Text style={styles.infoText}>{getApiBaseUrl()}</Text>
        <Pressable
          style={[
            styles.syncButton,
            loadingServices && styles.syncButtonDisabled,
          ]}
          disabled={loadingServices}
          onPress={handleSyncServices}>
          {loadingServices ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.syncButtonText}>Charger les services</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Mode hors ligne</Text>
        <Text style={styles.infoText}>
          Les donnees restent disponibles localement tant qu&apos;elles ne sont pas
          synchronisees.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaf4ff',
    padding: 16,
    gap: 18,
  },
  hero: {
    backgroundColor: '#f8fbff',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#cfe3ff',
    gap: 6,
  },
  eyebrow: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: 14,
  },
  actionCard: {
    minHeight: 148,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    justifyContent: 'center',
    gap: 8,
  },
  primaryCard: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  secondaryCard: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  cardIcon: {
    fontSize: 28,
    fontWeight: '800',
  },
  primaryCardIcon: {
    color: '#ffffff',
  },
  secondaryCardIcon: {
    color: '#0369a1',
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: '800',
  },
  primaryCardTitle: {
    color: '#ffffff',
  },
  secondaryCardTitle: {
    color: '#0f172a',
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  primaryCardText: {
    color: '#dcfce7',
  },
  secondaryCardText: {
    color: '#334155',
  },
  infoBox: {
    borderRadius: 12,
    backgroundColor: '#ecfeff',
    borderWidth: 1,
    borderColor: '#99f6e4',
    padding: 14,
    gap: 8,
  },
  infoTitle: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '800',
  },
  infoText: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 18,
  },
  syncButton: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.7,
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
