import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {RootTabParamList} from '../navigation/AppNavigator';

type Props = BottomTabScreenProps<RootTabParamList, 'Home'>;

export function HomeScreen({navigation}: Props) {
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
          <Text style={[styles.cardIcon, styles.primaryCardIcon]}>◎</Text>
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
          <Text style={[styles.cardIcon, styles.secondaryCardIcon]}>◷</Text>
          <Text style={[styles.cardTitle, styles.secondaryCardTitle]}>
            Consulter l&apos;historique
          </Text>
          <Text style={[styles.cardText, styles.secondaryCardText]}>
            Retrouver les visites, filtrer par date et preparer la
            synchronisation.
          </Text>
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
    fontWeight: '700',
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
    gap: 4,
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
});
