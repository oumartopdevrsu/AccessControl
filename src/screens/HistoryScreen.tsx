import React, {useCallback, useMemo, useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {ServiceDirectionChips} from '../components/ServiceDirectionChips';
import {getServiceDirections} from '../services/serviceDirectionService';
import {
  closeVisit,
  deleteVisit,
  getVisits,
  syncSelectedVisits,
  updateVisitExitTime,
} from '../services/visitService';
import {ServiceDirection, Visit} from '../types/domain';
import {todayInputValue} from '../utils/date';

export function HistoryScreen() {
  const [directions, setDirections] = useState<ServiceDirection[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('ALL');
  const [selectedVisitIds, setSelectedVisitIds] = useState<string[]>([]);
  const [editingExitVisitId, setEditingExitVisitId] = useState<string | null>(null);
  const [editingExitTime, setEditingExitTime] = useState('');

  const refreshData = useCallback(async () => {
    const [nextDirections, nextVisits] = await Promise.all([
      getServiceDirections(),
      getVisits(),
    ]);

    setDirections(nextDirections);
    setVisits(nextVisits);
    setSelectedVisitIds(current =>
      current.filter(id => nextVisits.some(visit => visit.id === id)),
    );
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

  const selectedCount = selectedVisitIds.length;
  const syncableFilteredVisits = filteredVisits.filter(visit => !!visit.heureSortie);
  const allFilteredSelected =
    syncableFilteredVisits.length > 0 &&
    syncableFilteredVisits.every(visit => selectedVisitIds.includes(visit.id));

  const toggleVisitSelection = (visitId: string) => {
    const visit = visits.find(item => item.id === visitId);

    if (visit && !visit.heureSortie) {
      Alert.alert(
        'Synchronisation',
        "Cette visite est encore en cours. Appuie sur 'Marquer la sortie' pour enregistrer automatiquement l'heure de sortie avant l'envoi.",
      );
      return;
    }

    setSelectedVisitIds(current =>
      current.includes(visitId)
        ? current.filter(id => id !== visitId)
        : [...current, visitId],
    );
  };

  const toggleSelectAllFiltered = () => {
    if (syncableFilteredVisits.length === 0) {
      Alert.alert(
        'Synchronisation',
        "Aucune visite terminee dans ce filtre. Marque d'abord les sorties pour pouvoir envoyer.",
      );
      return;
    }

    if (allFilteredSelected) {
      setSelectedVisitIds(current =>
        current.filter(
          id => !syncableFilteredVisits.some(visit => visit.id === id),
        ),
      );
      return;
    }

    setSelectedVisitIds(current => {
      const merged = new Set(current);
      syncableFilteredVisits.forEach(visit => merged.add(visit.id));
      return Array.from(merged);
    });
  };

  const markExit = async (visitId: string) => {
    await closeVisit(visitId);
    setEditingExitVisitId(null);
    setEditingExitTime('');
    await refreshData();
  };

  const startEditExitTime = (visit: Visit) => {
    setEditingExitVisitId(visit.id);
    setEditingExitTime(visit.heureSortie || '');
  };

  const cancelEditExitTime = () => {
    setEditingExitVisitId(null);
    setEditingExitTime('');
  };

  const saveExitTime = async (visitId: string) => {
    try {
      await updateVisitExitTime(visitId, editingExitTime);
      cancelEditExitTime();
      await refreshData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erreur de mise a jour.';
      Alert.alert('Heure de sortie', message);
    }
  };

  const confirmDeleteVisit = (visit: Visit) => {
    Alert.alert(
      'Supprimer la visite',
      `Supprimer localement la visite de ${visit.nom} ${visit.prenom} ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteVisit(visit.id);
            setSelectedVisitIds(current => current.filter(id => id !== visit.id));
            if (editingExitVisitId === visit.id) {
              cancelEditExitTime();
            }
            await refreshData();
          },
        },
      ],
    );
  };

  const syncVisits = async () => {
    if (selectedVisitIds.length === 0) {
      Alert.alert(
        'Synchronisation',
        'Selectionne au moins une visite a envoyer au serveur.',
      );
      return;
    }

    try {
      const response = await syncSelectedVisits(selectedVisitIds);

      await refreshData();
      setSelectedVisitIds([]);

      Alert.alert(
        'Synchronisation terminee',
        `${response.created} creee(s), ${response.duplicates} doublon(s), ${response.failed} echec(s).`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erreur de synchronisation.';
      Alert.alert('Synchronisation', message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.appName}>Access Control RSU</Text>
          <Text style={styles.title}>Historique des visites</Text>
        </View>
        <Pressable style={styles.syncButton} onPress={syncVisits}>
          <Text style={styles.syncButtonText}>
            Envoyer la selection ({selectedCount})
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          value={dateFilter}
          onChangeText={setDateFilter}
          placeholder={todayInputValue()}
        />
        <Text style={styles.filterHint}>
          Laisse vide pour afficher toutes les visites enregistrees localement.
        </Text>

        <Text style={styles.label}>Filtre service/direction</Text>
        <ServiceDirectionChips
          items={directions}
          value={directionFilter}
          includeAll
          onChange={setDirectionFilter}
        />

        <Pressable style={styles.selectAllButton} onPress={toggleSelectAllFiltered}>
          <Text style={styles.selectAllButtonText}>
            {allFilteredSelected
              ? 'Tout deselectionner'
              : 'Selectionner tout le filtre'}
          </Text>
        </Pressable>
        <Text style={styles.filterHint}>
          Seules les visites avec heure de sortie peuvent etre synchronisees.
        </Text>
      </View>

      {filteredVisits.length === 0 ? (
        <Text style={styles.emptyText}>Aucune visite pour ce filtre.</Text>
      ) : (
        filteredVisits.map(visit => {
          const isSelected = selectedVisitIds.includes(visit.id);
          const canSyncVisit = !!visit.heureSortie;
          const isEditingExit = editingExitVisitId === visit.id;
          return (
            <View key={visit.id} style={styles.visitItem}>
              <View style={styles.visitHeader}>
                <Pressable
                  style={[
                    styles.checkbox,
                    !canSyncVisit && styles.checkboxDisabled,
                    isSelected && styles.checkboxSelected,
                  ]}
                  onPress={() => toggleVisitSelection(visit.id)}>
                  <Text
                    style={[
                      styles.checkboxText,
                      isSelected && styles.checkboxTextSelected,
                    ]}>
                    {isSelected ? 'X' : ''}
                  </Text>
                </Pressable>

                <View style={styles.visitTopLine}>
                  <Text style={styles.visitName}>
                    {visit.nom} {visit.prenom}
                  </Text>
                  <Text style={styles.visitCode}>
                    {directionByCode[visit.codeServiceDirection]?.code ||
                      visit.codeServiceDirection}
                  </Text>
                </View>
              </View>

              <Text style={styles.visitMeta}>
                {directionByCode[visit.codeServiceDirection]?.libelle ||
                  visit.codeServiceDirection}
              </Text>
              <Text style={styles.visitMeta}>Genre: {visit.genre}</Text>
              {!!visit.dateDelivrance && (
                <Text style={styles.visitMeta}>
                  Date delivrance: {visit.dateDelivrance}
                </Text>
              )}
              <Text style={styles.visitMeta}>
                Doc: {visit.numeroDocument} | Contact: {visit.contact || '-'}
              </Text>
              <Text style={styles.visitMeta}>
                {visit.date} | Entree: {visit.heureEntree} | Sortie:{' '}
                {visit.heureSortie || 'en cours'}
              </Text>
              {!visit.heureSortie && (
                <Text style={styles.pendingText}>
                  Visite en cours: la sortie sera enregistree automatiquement au
                  moment du clic sur le bouton ci-dessous.
                </Text>
              )}
              {!!visit.motif && <Text style={styles.visitMeta}>{visit.motif}</Text>}

              {!visit.heureSortie && (
                <Pressable
                  style={styles.smallButton}
                  onPress={() => markExit(visit.id)}>
                  <Text style={styles.smallButtonText}>
                    Marquer la sortie maintenant
                  </Text>
                </Pressable>
              )}

              {!!visit.heureSortie && !isEditingExit && (
                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.editButton}
                    onPress={() => startEditExitTime(visit)}>
                    <Text style={styles.editButtonText}>Modifier la sortie</Text>
                  </Pressable>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => confirmDeleteVisit(visit)}>
                    <Text style={styles.deleteButtonText}>Supprimer</Text>
                  </Pressable>
                </View>
              )}

              {isEditingExit && (
                <View style={styles.editBox}>
                  <Text style={styles.label}>Nouvelle heure de sortie</Text>
                  <TextInput
                    style={styles.input}
                    value={editingExitTime}
                    onChangeText={setEditingExitTime}
                    placeholder="HH:mm ou HH:mm:ss"
                  />
                  <View style={styles.editActions}>
                    <Pressable
                      style={styles.editCancelButton}
                      onPress={cancelEditExitTime}>
                      <Text style={styles.editCancelButtonText}>Annuler</Text>
                    </Pressable>
                    <Pressable
                      style={styles.editSaveButton}
                      onPress={() => saveExitTime(visit.id)}>
                      <Text style={styles.editSaveButtonText}>Enregistrer</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaf4ff',
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
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    color: '#0f172a',
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
  },
  section: {
    backgroundColor: '#f8fbff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#cfe3ff',
    gap: 10,
  },
  label: {
    color: '#1e3a8a',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  filterHint: {
    marginTop: -2,
    color: '#64748b',
    fontSize: 12,
  },
  syncButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0284c7',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
  },
  syncButtonText: {
    color: '#0369a1',
    fontWeight: '800',
    fontSize: 12,
  },
  selectAllButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0f766e',
  },
  selectAllButtonText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  emptyText: {
    color: '#475569',
    paddingVertical: 16,
    textAlign: 'center',
  },
  visitItem: {
    backgroundColor: '#f8fbff',
    borderWidth: 1,
    borderColor: '#cfe3ff',
    borderRadius: 10,
    padding: 12,
    gap: 5,
  },
  visitHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  checkboxDisabled: {
    opacity: 0.45,
  },
  checkboxText: {
    color: '#eff6ff',
    fontWeight: '900',
    fontSize: 12,
  },
  checkboxTextSelected: {
    color: '#ffffff',
  },
  visitTopLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    flex: 1,
  },
  visitName: {
    color: '#0f172a',
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  visitCode: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '900',
  },
  visitMeta: {
    color: '#334155',
    fontSize: 13,
  },
  pendingText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '600',
  },
  smallButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: '#0f766e',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  smallButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  editButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0284c7',
    backgroundColor: '#eff6ff',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  editButtonText: {
    color: '#0369a1',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  deleteButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#b91c1c',
    fontWeight: '700',
  },
  editBox: {
    marginTop: 8,
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editCancelButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
  },
  editCancelButtonText: {
    color: '#334155',
    fontWeight: '700',
  },
  editSaveButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f766e',
  },
  editSaveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
