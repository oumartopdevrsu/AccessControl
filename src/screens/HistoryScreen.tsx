import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ServiceDirectionChips } from '../components/ServiceDirectionChips';
import { getServiceDirections } from '../services/serviceDirectionService';
import {
  closeVisit,
  getVisits,
  syncVisitsEndOfDay,
} from '../services/visitService';
import { ServiceDirection, Visit } from '../types/domain';
import { todayInputValue } from '../utils/date';

export function HistoryScreen() {
  const [directions, setDirections] = useState<ServiceDirection[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [dateFilter, setDateFilter] = useState(todayInputValue());
  const [directionFilter, setDirectionFilter] = useState('ALL');

  const refreshData = useCallback(async () => {
    const [nextDirections, nextVisits] = await Promise.all([
      getServiceDirections(),
      getVisits(),
    ]);

    setDirections(nextDirections);
    setVisits(nextVisits);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData]),
  );

  const directionByCode = useMemo(() => {
    return directions.reduce<Record<string, ServiceDirection>>((acc, item) => {
      acc[item.code] = item;
      return acc;
    }, {});
  }, [directions]);

  const filteredVisits = useMemo(() => {
    return visits.filter(visit => {
      const matchesDate = !dateFilter || visit.date === dateFilter;
      const matchesDirection =
        directionFilter === 'ALL' ||
        visit.codeServiceDirection === directionFilter;

      return matchesDate && matchesDirection;
    });
  }, [dateFilter, directionFilter, visits]);

  const markExit = async (visitId: string) => {
    await closeVisit(visitId);
    await refreshData();
  };

  const syncVisits = async () => {
    const syncedCount = await syncVisitsEndOfDay();

    if (syncedCount === 0) {
      Alert.alert('Synchronisation', 'Aucune visite a envoyer.');
      return;
    }

    await refreshData();
    Alert.alert(
      'Synchronisation terminee',
      `${syncedCount} visite(s) envoyee(s) et supprimee(s) localement.`,
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.appName}>Access Control RSU</Text>
          <Text style={styles.title}>Historique des visites</Text>
        </View>
        <Pressable style={styles.dangerButton} onPress={syncVisits}>
          <Text style={styles.dangerButtonText}>Envoyer fin journee</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          value={dateFilter}
          onChangeText={setDateFilter}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.label}>Filtre service/direction</Text>
        <ServiceDirectionChips
          items={directions}
          value={directionFilter}
          includeAll
          onChange={setDirectionFilter}
        />
      </View>

      {filteredVisits.length === 0 ? (
        <Text style={styles.emptyText}>Aucune visite pour ce filtre.</Text>
      ) : (
        filteredVisits.map(visit => (
          <View key={visit.id} style={styles.visitItem}>
            <View style={styles.visitTopLine}>
              <Text style={styles.visitName}>
                {visit.nom} {visit.prenom}
              </Text>
              <Text style={styles.visitCode}>
                {directionByCode[visit.codeServiceDirection]?.code ||
                  visit.codeServiceDirection}
              </Text>
            </View>
            <Text style={styles.visitMeta}>
              {directionByCode[visit.codeServiceDirection]?.libelle ||
                visit.codeServiceDirection}
            </Text>
            {!!visit.dateNaissance && (
              <Text style={styles.visitMeta}>
                Date naissance: {visit.dateNaissance}
              </Text>
            )}
            <Text style={styles.visitMeta}>
              Doc: {visit.numeroDocument} | Contact: {visit.contact || '-'}
            </Text>
            <Text style={styles.visitMeta}>
              {visit.date} | Entree: {visit.heureEntree} | Sortie:{' '}
              {visit.heureSortie || 'en cours'}
            </Text>
            {!!visit.motif && <Text style={styles.visitMeta}>{visit.motif}</Text>}

            {!visit.heureSortie && (
              <Pressable
                style={styles.smallButton}
                onPress={() => markExit(visit.id)}>
                <Text style={styles.smallButtonText}>Marquer la sortie</Text>
              </Pressable>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f9',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  appName: {
    color: '#14532d',
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    color: '#111827',
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  label: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  dangerButton: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#b91c1c',
    paddingHorizontal: 10,
  },
  dangerButtonText: {
    color: '#b91c1c',
    fontWeight: '800',
  },
  emptyText: {
    color: '#6b7280',
    paddingVertical: 16,
    textAlign: 'center',
  },
  visitItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    gap: 5,
  },
  visitTopLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  visitName: {
    color: '#111827',
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  visitCode: {
    color: '#14532d',
    fontSize: 12,
    fontWeight: '900',
  },
  visitMeta: {
    color: '#4b5563',
    fontSize: 13,
  },
  smallButton: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    backgroundColor: '#1f2937',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  smallButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
