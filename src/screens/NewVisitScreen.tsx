/**
 * Écran d'enregistrement d'une nouvelle visite.
 *
 * Flux :
 *  1. Sélectionner le service/direction visité.
 *  2. (Optionnel) Scanner la CNIB pour pré-remplir nom, prénom,
 *     date de délivrance et numéro de document via OCR.
 *  3. Compléter ou corriger les champs manuellement.
 *  4. Soumettre → création d'une entrée Realm avec horodatage automatique.
 *
 * La logique métier est dans visitService.ts et ocrService.ts.
 */

import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {ServiceDirectionChips} from '../components/ServiceDirectionChips';
import {scanCnib} from '../services/ocrService';
import {getServiceDirections} from '../services/serviceDirectionService';
import {createVisit, MAX_MOTIF_LENGTH} from '../services/visitService';
import {EMPTY_VISIT_FORM, ServiceDirection, VisitForm} from '../types/domain';
import {Colors, FontSize, Radius, Shadows, Spacing} from '../theme';

export function NewVisitScreen() {
  const [directions, setDirections]   = useState<ServiceDirection[]>([]);
  const [form, setForm]               = useState<VisitForm>(EMPTY_VISIT_FORM);
  const [scanStatus, setScanStatus]   = useState('');
  const [isScanning, setIsScanning]   = useState(false);

  // Charge les services/directions dès l'ouverture de l'écran
  useEffect(() => {
    const loadDirections = async () => {
      const nextDirections = await getServiceDirections();
      setDirections(nextDirections);
      // Conserve la sélection courante si elle existe, sinon prend le premier
      setForm(current => ({
        ...current,
        codeServiceDirection: nextDirections.some(
          item => item.code === current.codeServiceDirection,
        )
          ? current.codeServiceDirection
          : nextDirections[0]?.code || '',
      }));
    };
    loadDirections();
  }, []);

  /** Met à jour un seul champ du formulaire */
  const updateForm = (key: keyof VisitForm, value: string) => {
    setForm(current => ({...current, [key]: value}));
  };

  /** Lance l'OCR sur une photo de CNIB et pré-remplit les champs correspondants */
  const handleScanCnib = async () => {
    try {
      setIsScanning(true);
      setScanStatus('Capture du document et analyse OCR en cours…');

      const extracted = await scanCnib();

      if (!extracted) {
        setScanStatus('Scan annulé.');
        return;
      }

      // Fusionne les champs extraits sans écraser les saisies manuelles existantes
      setForm(current => ({
        ...current,
        nom:             extracted.nom             || current.nom,
        prenom:          extracted.prenom          || current.prenom,
        dateDelivrance:  extracted.dateDelivrance  || current.dateDelivrance,
        numeroDocument:  extracted.numeroDocument  || current.numeroDocument,
        genre:           extracted.genre           || current.genre,
      }));

      const extractedFields = [
        extracted.nom            && 'nom',
        extracted.prenom         && 'prénom',
        extracted.dateDelivrance && 'date de délivrance',
        extracted.numeroDocument && 'numéro document',
        extracted.genre          && 'genre',
      ].filter(Boolean);

      const missingFields = [
        !extracted.nom            && 'nom',
        !extracted.prenom         && 'prénom',
        !extracted.dateDelivrance && 'date de délivrance',
        !extracted.numeroDocument && 'numéro document',
        !extracted.genre          && 'genre',
      ].filter(Boolean);

      if (extractedFields.length === 0) {
        setScanStatus(
          "Photo prise, mais les champs cibles de la CNIB n'ont pas été trouvés.",
        );
        Alert.alert(
          'Scan CNIB',
          "Le texte a été lu, mais les champs attendus n'ont pas été identifiés. Reprends la photo bien à plat, avec une bonne lumière.",
        );
        return;
      }

      setScanStatus(
        missingFields.length > 0
          ? `Scan partiel — trouvé : ${extractedFields.join(', ')}. À compléter : ${missingFields.join(', ')}.`
          : `Scan complet — ${extractedFields.join(', ')} renseigné(s). Complète le contact manuellement.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erreur inconnue pendant le scan.';
      setScanStatus('Le scan a échoué.');
      Alert.alert('Scan CNIB', message);
    } finally {
      setIsScanning(false);
    }
  };

  /** Valide le formulaire et enregistre la visite en local (Realm) */
  const submitVisit = async () => {
    // Champs obligatoires
    if (
      !form.nom.trim() ||
      !form.prenom.trim() ||
      !form.genre ||
      !form.dateDelivrance.trim() ||
      !form.numeroDocument.trim()
    ) {
      Alert.alert(
        'Champs requis',
        'Le nom, le prénom, le genre, la date de délivrance et le numéro du document sont obligatoires.',
      );
      return;
    }

    if (!form.codeServiceDirection) {
      Alert.alert('Service requis', 'Sélectionne le service ou la direction concernée.');
      return;
    }

    await createVisit(form);

    // Réinitialise le formulaire en conservant le service sélectionné
    setForm(current => ({
      ...EMPTY_VISIT_FORM,
      codeServiceDirection: current.codeServiceDirection,
    }));
    setScanStatus('');
    Alert.alert('Visite enregistrée', 'La visite a été sauvegardée localement.');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>

      {/* ── Section service/direction ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Direction ou service visité</Text>

        <Text style={styles.label}>Service ou direction *</Text>
        <ServiceDirectionChips
          items={directions}
          value={form.codeServiceDirection}
          onChange={value => updateForm('codeServiceDirection', value)}
        />

        {directions.length === 0 ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Aucun service disponible. Reviens à l'accueil pour charger les
              services depuis le backend.
            </Text>
          </View>
        ) : (
          <Text style={styles.helperText}>
            Seuls les services synchronisés avec le backend sont proposés.
          </Text>
        )}
      </View>

      {/* ── Section scan CNIB + saisie des informations ── */}
      <View style={styles.section}>
        {/* En-tête scan avec bouton caméra */}
        <View style={styles.scanHeader}>
          <View style={styles.scanHeaderText}>
            <Text style={styles.sectionTitle}>Informations du document</Text>
            <Text style={styles.scanHelp}>
              Scanner la CNIB pour pré-remplir les champs automatiquement.
            </Text>
          </View>
          <Pressable
            style={[styles.scanBtn, isScanning && styles.scanBtnDisabled]}
            disabled={isScanning}
            onPress={handleScanCnib}>
            {isScanning ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Text style={styles.scanBtnIcon}>⊙</Text>
                <Text style={styles.scanBtnText}>Scanner CNIB</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Résultat du scan OCR */}
        {!!scanStatus && (
          <View style={styles.scanResultBox}>
            <Text style={styles.scanResultText}>{scanStatus}</Text>
          </View>
        )}

        {/* Nom et Prénom côte à côte */}
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              value={form.nom}
              autoCapitalize="characters"
              onChangeText={value => updateForm('nom', value)}
              placeholder="Nom"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Prénom *</Text>
            <TextInput
              style={styles.input}
              value={form.prenom}
              onChangeText={value => updateForm('prenom', value)}
              placeholder="Prénom"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        {/* Sélection du genre */}
        <Text style={styles.label}>Genre *</Text>
        <View style={styles.genderRow}>
          <Pressable
            style={[styles.genderChip, form.genre === 'M' && styles.genderChipActive]}
            onPress={() => updateForm('genre', 'M')}>
            <Text
              style={[
                styles.genderChipText,
                form.genre === 'M' && styles.genderChipTextActive,
              ]}>
              Masculin
            </Text>
          </Pressable>
          <Pressable
            style={[styles.genderChip, form.genre === 'F' && styles.genderChipActive]}
            onPress={() => updateForm('genre', 'F')}>
            <Text
              style={[
                styles.genderChipText,
                form.genre === 'F' && styles.genderChipTextActive,
              ]}>
              Féminin
            </Text>
          </Pressable>
        </View>

        {/* Date de délivrance */}
        <Text style={styles.label}>Date de délivrance *</Text>
        <TextInput
          style={styles.input}
          value={form.dateDelivrance}
          onChangeText={value => updateForm('dateDelivrance', value)}
          placeholder="JJ/MM/AAAA"
          placeholderTextColor={Colors.textMuted}
        />

        {/* Numéro de document */}
        <Text style={styles.label}>Numéro document *</Text>
        <TextInput
          style={styles.input}
          value={form.numeroDocument}
          onChangeText={value => updateForm('numeroDocument', value)}
          placeholder="CNIB, passeport…"
          placeholderTextColor={Colors.textMuted}
        />

        {/* Téléphone de contact */}
        <Text style={styles.label}>Contact</Text>
        <TextInput
          style={styles.input}
          value={form.contact}
          onChangeText={value => updateForm('contact', value)}
          placeholder="Numéro de téléphone"
          placeholderTextColor={Colors.textMuted}
          keyboardType="phone-pad"
        />

        {/* Motif de la visite */}
        <View>
          <Text style={styles.label}>Motif de la visite</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={form.motif}
            onChangeText={value => updateForm('motif', value)}
            placeholder="Optionnel"
            placeholderTextColor={Colors.textMuted}
            maxLength={MAX_MOTIF_LENGTH}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {form.motif.length} / {MAX_MOTIF_LENGTH}
          </Text>
        </View>

        {/* Bouton de soumission */}
        <Pressable style={styles.submitBtn} onPress={submitVisit}>
          <Text style={styles.submitBtnText}>Enregistrer la visite</Text>
        </Pressable>
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

  // ── Sections ───────────────────────────────────────────────────────────────
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

  // ── Textes auxiliaires ─────────────────────────────────────────────────────
  helperText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: -Spacing.xs,
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },

  // ── Boîte d'avertissement (aucun service) ──────────────────────────────────
  warningBox: {
    borderRadius: Radius.sm,
    backgroundColor: Colors.warningBg,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    padding: Spacing.sm,
  },
  warningText: {
    color: Colors.warning,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },

  // ── Scan CNIB ──────────────────────────────────────────────────────────────
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  scanHeaderText: {
    flex: 1,
    gap: 4,
  },
  scanHelp: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaint,
    minWidth: 130,
    justifyContent: 'center',
  },
  scanBtnDisabled: {
    opacity: 0.65,
  },
  scanBtnIcon: {
    fontSize: 16,
    color: Colors.primary,
  },
  scanBtnText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  scanResultBox: {
    borderRadius: Radius.sm,
    backgroundColor: Colors.successBg,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  scanResultText: {
    color: Colors.success,
    fontSize: FontSize.sm,
    fontWeight: '600',
    lineHeight: 18,
  },

  // ── Champs de formulaire ───────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  field: {
    flex: 1,
    gap: Spacing.xs,
  },
  label: {
    color: Colors.navy,
    fontSize: FontSize.sm,
    fontWeight: '700',
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
  textarea: {
    minHeight: 88,
    paddingTop: Spacing.sm,
  },

  // ── Sélection du genre ─────────────────────────────────────────────────────
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  genderChip: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
  },
  genderChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderChipText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  genderChipTextActive: {
    color: Colors.textOnPrimary,
  },

  // ── Bouton de soumission ───────────────────────────────────────────────────
  submitBtn: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    marginTop: Spacing.xs,
    ...Shadows.md,
  },
  submitBtnText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
});
