/**
 * Écran d'historique des visites.
 *
 * Fonctionnalités :
 *  - Filtrage par date et par service/direction.
 *  - Sélection multiple pour synchronisation groupée.
 *  - Marquer la sortie (automatique ou manuelle).
 *  - Modifier l'heure de sortie d'une visite terminée.
 *  - Supprimer une visite locale.
 *  - Envoyer la sélection vers le backend.
 *
 * Rafraîchissement : au focus de l'écran (useFocusEffect).
 */

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
import {Colors, FontSize, Radius, Shadows, Spacing} from '../theme';

export function HistoryScreen() {
  const [directions, setDirections]               = useState<ServiceDirection[]>([]);
  const [visits, setVisits]                       = useState<Visit[]>([]);
  const [dateFilter, setDateFilter]               = useState('');
  const [directionFilter, setDirectionFilter]     = useState('ALL');
  const [selectedVisitIds, setSelectedVisitIds]   = useState<string[]>([]);
  const [editingExitVisitId, setEditingExitVisitId] = useState<string | null>(null);
  const [editingExitTime, setEditingExitTime]     = useState('');

  /** Recharge les directions et visites depuis Realm */
  const refreshData = useCallback(async () => {
    const [nextDirections, nextVisits] = await Promise.all([
      getServiceDirections(),
      getVisits(),
    ]);
    setDirections(nextDirections);
    setVisits(nextVisits);
    // Retire les IDs sélectionnés qui n'existent plus
    setSelectedVisitIds(current =>
      current.filter(id => nextVisits.some(v => v.id === id)),
    );
  }, []);

  // Rafraîchit à chaque fois que l'onglet devient actif
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData]),
  );

  /** Map code → direction pour afficher les libellés */
  const directionByCode = useMemo(
    () =>
      directions.reduce<Record<string, ServiceDirection>>((acc, item) => {
        acc[item.code] = item;
        return acc;
      }, {}),
    [directions],
  );

  /** Visites filtrées selon la date et le service sélectionné */
  const filteredVisits = useMemo(
    () =>
      visits.filter(v => {
        const matchDate      = !dateFilter || v.date === dateFilter;
        const matchDirection =
          directionFilter === 'ALL' || v.codeServiceDirection === directionFilter;
        return matchDate && matchDirection;
      }),
    [dateFilter, directionFilter, visits],
  );

  // Visites terminées (heure de sortie renseignée) dans le filtre courant
  const syncableFiltered = filteredVisits.filter(v => !!v.heureSortie);
  const allFilteredSelected =
    syncableFiltered.length > 0 &&
    syncableFiltered.every(v => selectedVisitIds.includes(v.id));

  // ─── Sélection ────────────────────────────────────────────────────────────

  const toggleVisitSelection = (visitId: string) => {
    const visit = visits.find(v => v.id === visitId);
    // Une visite en cours ne peut pas être synchronisée
    if (visit && !visit.heureSortie) {
      Alert.alert(
        'Synchronisation',
        "Cette visite est encore en cours. Appuie sur 'Marquer la sortie' avant l'envoi.",
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
    if (syncableFiltered.length === 0) {
      Alert.alert(
        'Synchronisation',
        "Aucune visite terminée dans ce filtre. Marque d'abord les sorties.",
      );
      return;
    }
    if (allFilteredSelected) {
      // Désélectionne toutes les visites du filtre
      setSelectedVisitIds(current =>
        current.filter(id => !syncableFiltered.some(v => v.id === id)),
      );
      return;
    }
    // Ajoute toutes les visites terminées du filtre à la sélection
    setSelectedVisitIds(current => {
      const merged = new Set(current);
      syncableFiltered.forEach(v => merged.add(v.id));
      return Array.from(merged);
    });
  };

  // ─── Actions sur les visites ──────────────────────────────────────────────

  /** Enregistre automatiquement l'heure de sortie */
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

  /** Sauvegarde l'heure de sortie modifiée manuellement */
  const saveExitTime = async (visitId: string) => {
    try {
      await updateVisitExitTime(visitId, editingExitTime);
      cancelEditExitTime();
      await refreshData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erreur de mise à jour.';
      Alert.alert('Heure de sortie', message);
    }
  };

  /** Demande confirmation avant suppression locale */
  const confirmDeleteVisit = (visit: Visit) => {
    Alert.alert(
      'Supprimer la visite',
      `Supprimer localement la visite de ${visit.nom} ${visit.prenom} ?`,
      [
        {text: 'Annuler', style: 'cancel'},
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

  /** Envoie les visites sélectionnées vers le backend */
  const syncVisits = async () => {
    if (selectedVisitIds.length === 0) {
      Alert.alert('Synchronisation', 'Sélectionne au moins une visite à envoyer.');
      return;
    }
    try {
      const response = await syncSelectedVisits(selectedVisitIds);
      await refreshData();
      setSelectedVisitIds([]);
      Alert.alert(
        'Synchronisation terminée',
        `${response.created} créée(s), ${response.duplicates} doublon(s), ${response.failed} échec(s).`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erreur de synchronisation.';
      Alert.alert('Synchronisation', message);
    }
  };

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* ── En-tête avec bouton d'envoi ── */}
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderText}>
          <Text style={styles.pageTitle}>Historique</Text>
          <Text style={styles.pageSubtitle}>
            {filteredVisits.length} visite(s) affichée(s)
          </Text>
        </View>
        <Pressable
          style={[
            styles.sendBtn,
            selectedVisitIds.length === 0 && styles.sendBtnDisabled,
          ]}
          onPress={syncVisits}>
          <Text style={styles.sendBtnText}>
            Envoyer ({selectedVisitIds.length})
          </Text>
        </Pressable>
      </View>

      {/* ── Filtres ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Filtres</Text>

        {/* Filtre par date */}
        <View>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={dateFilter}
            onChangeText={setDateFilter}
            placeholder={todayInputValue()}
            placeholderTextColor={Colors.textMuted}
          />
          <Text style={styles.helperText}>
            Laisser vide pour afficher toutes les visites.
          </Text>
        </View>

        {/* Filtre par service */}
        <View>
          <Text style={styles.label}>Service / Direction</Text>
          <ServiceDirectionChips
            items={directions}
            value={directionFilter}
            includeAll
            onChange={setDirectionFilter}
          />
        </View>

        {/* Sélection globale */}
        <Pressable style={styles.selectAllBtn} onPress={toggleSelectAllFiltered}>
          <Text style={styles.selectAllBtnText}>
            {allFilteredSelected
              ? '☑  Tout désélectionner'
              : '☐  Sélectionner toutes les visites terminées'}
          </Text>
        </Pressable>
        <Text style={styles.helperText}>
          Seules les visites avec heure de sortie peuvent être synchronisées.
        </Text>
      </View>

      {/* ── Liste des visites ── */}
      {filteredVisits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Aucune visite pour ce filtre.</Text>
        </View>
      ) : (
        filteredVisits.map(visit => {
          const isSelected   = selectedVisitIds.includes(visit.id);
          const canSync      = !!visit.heureSortie;
          const isEditingExit = editingExitVisitId === visit.id;
          const dirLabel     =
            directionByCode[visit.codeServiceDirection]?.libelle ||
            visit.codeServiceDirection;

          return (
            <View
              key={visit.id}
              style={[styles.visitCard, isSelected && styles.visitCardSelected]}>

              {/* ── Ligne principale : checkbox + nom + code ── */}
              <View style={styles.visitCardHeader}>
                <Pressable
                  style={[
                    styles.checkbox,
                    !canSync      && styles.checkboxDisabled,
                    isSelected    && styles.checkboxChecked,
                  ]}
                  onPress={() => toggleVisitSelection(visit.id)}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </Pressable>

                <View style={styles.visitCardHeaderBody}>
                  <Text style={styles.visitName}>
                    {visit.nom} {visit.prenom}
                  </Text>
                  {/* Badge de code de service */}
                  <View style={styles.serviceBadge}>
                    <Text style={styles.serviceBadgeText}>
                      {directionByCode[visit.codeServiceDirection]?.code ||
                        visit.codeServiceDirection}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ── Métadonnées ── */}
              <Text style={styles.visitMetaLabel}>{dirLabel}</Text>

              <View style={styles.metaGrid}>
                <MetaRow icon="◈" label="Genre"   value={visit.genre} />
                {!!visit.dateDelivrance && (
                  <MetaRow icon="📅" label="Délivrance" value={visit.dateDelivrance} />
                )}
                <MetaRow icon="🪪" label="Document" value={visit.numeroDocument} />
                {!!visit.contact && (
                  <MetaRow icon="📞" label="Contact" value={visit.contact} />
                )}
                <MetaRow icon="📆" label="Date"    value={visit.date} />
                <MetaRow icon="⏱" label="Entrée"  value={visit.heureEntree} />
                <MetaRow
                  icon="⏹"
                  label="Sortie"
                  value={visit.heureSortie || '—'}
                  // Visite en cours → texte orange
                  valueStyle={!visit.heureSortie ? styles.pendingValue : undefined}
                />
              </View>

              {!!visit.motif && (
                <Text style={styles.visitMotif}>Motif : {visit.motif}</Text>
              )}

              {/* Badge "en cours" si pas encore de sortie */}
              {!visit.heureSortie && (
                <View style={styles.inProgressBadge}>
                  <Text style={styles.inProgressBadgeText}>Visite en cours</Text>
                </View>
              )}

              {/* ── Actions ── */}

              {/* Marquer la sortie maintenant */}
              {!visit.heureSortie && (
                <Pressable
                  style={styles.exitBtn}
                  onPress={() => markExit(visit.id)}>
                  <Text style={styles.exitBtnText}>Marquer la sortie</Text>
                </Pressable>
              )}

              {/* Modifier la sortie / Supprimer */}
              {!!visit.heureSortie && !isEditingExit && (
                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.editBtn}
                    onPress={() => startEditExitTime(visit)}>
                    <Text style={styles.editBtnText}>Modifier la sortie</Text>
                  </Pressable>
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => confirmDeleteVisit(visit)}>
                    <Text style={styles.deleteBtnText}>Supprimer</Text>
                  </Pressable>
                </View>
              )}

              {/* Formulaire d'édition de l'heure de sortie */}
              {isEditingExit && (
                <View style={styles.editBox}>
                  <Text style={styles.label}>Nouvelle heure de sortie</Text>
                  <TextInput
                    style={styles.input}
                    value={editingExitTime}
                    onChangeText={setEditingExitTime}
                    placeholder="HH:mm ou HH:mm:ss"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <View style={styles.editBoxActions}>
                    <Pressable
                      style={styles.editCancelBtn}
                      onPress={cancelEditExitTime}>
                      <Text style={styles.editCancelBtnText}>Annuler</Text>
                    </Pressable>
                    <Pressable
                      style={styles.editSaveBtn}
                      onPress={() => saveExitTime(visit.id)}>
                      <Text style={styles.editSaveBtnText}>Enregistrer</Text>
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

// ─── Composant utilitaire : ligne de métadonnée ───────────────────────────────

type MetaRowProps = {
  icon: string;
  label: string;
  value: string;
  valueStyle?: object;
};

function MetaRow({icon, label, value, valueStyle}: MetaRowProps) {
  return (
    <View style={metaStyles.row}>
      <Text style={metaStyles.icon}>{icon}</Text>
      <Text style={metaStyles.label}>{label} : </Text>
      <Text style={[metaStyles.value, valueStyle]}>{value}</Text>
    </View>
  );
}

const metaStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    fontSize: 12,
    width: 16,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  value: {
    color: Colors.textPrimary,
    fontSize: FontSize.xs,
    fontWeight: '500',
    flexShrink: 1,
  },
});

// ─── Styles principaux ────────────────────────────────────────────────────────

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

  // ── En-tête de page ─────────────────────────────────────────────────────────
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  pageHeaderText: {
    flex: 1,
    gap: 2,
  },
  pageTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  pageSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  // Bouton d'envoi en haut à droite
  sendBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    ...Shadows.sm,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },
  sendBtnText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },

  // ── Panneaux de filtre ──────────────────────────────────────────────────────
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  label: {
    color: Colors.navy,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  input: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    fontSize: FontSize.md,
  },
  helperText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: -Spacing.xs,
  },
  selectAllBtn: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryFaint,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  selectAllBtnText: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: FontSize.sm,
  },

  // ── État vide ───────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyStateText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },

  // ── Carte de visite ─────────────────────────────────────────────────────────
  visitCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  visitCardSelected: {
    // Bordure bleue quand sélectionnée pour la synchronisation
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  visitCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  visitCardHeaderBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  visitName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },

  // Badge de code de service
  serviceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryFaint,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  serviceBadgeText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  visitMetaLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: -Spacing.xs,
  },
  metaGrid: {
    gap: Spacing.xs,
  },
  pendingValue: {
    color: Colors.warning,
    fontWeight: '700',
  },
  visitMotif: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Badge "en cours"
  inProgressBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.warningBg,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  inProgressBadgeText: {
    color: Colors.warning,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  // ── Bouton de sortie ────────────────────────────────────────────────────────
  exitBtn: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    backgroundColor: Colors.success,
    marginTop: Spacing.xs,
  },
  exitBtnText: {
    color: Colors.textOnPrimary,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },

  // ── Actions modifier / supprimer ────────────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  editBtn: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaint,
  },
  editBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  deleteBtn: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.errorBorder,
    backgroundColor: Colors.errorBg,
  },
  deleteBtnText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },

  // ── Boîte d'édition de l'heure de sortie ──────────────────────────────────
  editBox: {
    marginTop: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.infoBg,
    borderWidth: 1,
    borderColor: Colors.infoBorder,
    gap: Spacing.sm,
  },
  editBoxActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  editCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editCancelBtnText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  editSaveBtn: {
    flex: 1,
    height: 42,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  editSaveBtnText: {
    color: Colors.textOnPrimary,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },

  // Champ caché dans la case à cocher — conservé pour satisfaire le checkbox
  checkmark: {
    color: Colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
  },

  // ── Case à cocher ───────────────────────────────────────────────────────────
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxDisabled: {
    opacity: 0.38,
  },
});
