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
import {createVisit} from '../services/visitService';
import {
  EMPTY_VISIT_FORM,
  ServiceDirection,
  VisitForm,
} from '../types/domain';

export function NewVisitScreen() {
  const [directions, setDirections] = useState<ServiceDirection[]>([]);
  const [form, setForm] = useState<VisitForm>(EMPTY_VISIT_FORM);
  const [scanStatus, setScanStatus] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const loadDirections = async () => {
      const nextDirections = await getServiceDirections();
      setDirections(nextDirections);
      setForm(current => ({
        ...current,
        codeServiceDirection:
          current.codeServiceDirection || nextDirections[0]?.code || '',
      }));
    };

    loadDirections();
  }, []);

  const updateForm = (key: keyof VisitForm, value: string) => {
    setForm(current => ({...current, [key]: value}));
  };

  const handleScanCnib = async () => {
    try {
      setIsScanning(true);
      setScanStatus('Capture du document et analyse OCR en cours...');

      const extracted = await scanCnib();

      if (!extracted) {
        setScanStatus('Scan annule.');
        return;
      }

      setForm(current => ({
        ...current,
        nom: extracted.nom || current.nom,
        prenom: extracted.prenom || current.prenom,
        dateDelivrance: extracted.dateDelivrance || current.dateDelivrance,
        numeroDocument: extracted.numeroDocument || current.numeroDocument,
      }));

      const extractedFields = [
        extracted.nom && 'nom',
        extracted.prenom && 'prenom',
        extracted.dateDelivrance && 'date de delivrance',
        extracted.numeroDocument && 'numero document',
      ].filter(Boolean);

      if (extractedFields.length === 0) {
        setScanStatus(
          'Photo prise, mais les champs cibles de la CNIB n ont pas ete trouves.',
        );
        return;
      }

      setScanStatus(
        `Scan termine : ${extractedFields.join(', ')} renseigne(s). Complete le genre et le contact manuellement.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erreur inconnue pendant le scan.';
      setScanStatus('Le scan a echoue.');
      Alert.alert('Scan CNIB', message);
    } finally {
      setIsScanning(false);
    }
  };

  const submitVisit = async () => {
    if (
      !form.nom.trim() ||
      !form.prenom.trim() ||
      !form.genre ||
      !form.dateDelivrance.trim() ||
      !form.numeroDocument.trim()
    ) {
      Alert.alert(
        'Champs requis',
        'Le nom, le prenom, le genre, la date de delivrance et le numero du document sont obligatoires.',
      );
      return;
    }

    if (!form.codeServiceDirection) {
      Alert.alert(
        'Service requis',
        'Selectionne le service ou la direction concernee.',
      );
      return;
    }

    await createVisit(form);
    setForm(current => ({
      ...EMPTY_VISIT_FORM,
      codeServiceDirection: current.codeServiceDirection,
    }));
    setScanStatus('');
    Alert.alert('Visite enregistree', 'La visite a ete sauvegardee localement.');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.appName}>Access Control RSU</Text>
        <Text style={styles.title}>Enregistrement</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Direction ou service visite</Text>
        <Text style={styles.label}>Service ou direction</Text>
        <ServiceDirectionChips
          items={directions}
          value={form.codeServiceDirection}
          onChange={value => updateForm('codeServiceDirection', value)}
        />
        {directions.length === 0 && (
          <Text style={styles.helperText}>
            Aucun service local. Reviens a l&apos;accueil pour charger les
            services du backend.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.scanHeader}>
          <View style={styles.scanTextBlock}>
            <Text style={styles.sectionTitle}>Scan document</Text>
            <Text style={styles.scanHelp}>
              Scanner la CNIB pour recuperer nom, prenom, date de delivrance et
              numero du document.
            </Text>
          </View>
          <Pressable
            style={[
              styles.secondaryButton,
              isScanning && styles.secondaryButtonDisabled,
            ]}
            disabled={isScanning}
            onPress={handleScanCnib}>
            {isScanning ? (
              <ActivityIndicator size="small" color="#0f766e" />
            ) : (
              <Text style={styles.secondaryButtonText}>Scanner CNIB</Text>
            )}
          </Pressable>
        </View>

        {!!scanStatus && (
          <View style={styles.scanStatus}>
            <Text style={styles.scanStatusText}>{scanStatus}</Text>
          </View>
        )}

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              value={form.nom}
              autoCapitalize="characters"
              onChangeText={value => updateForm('nom', value)}
              placeholder="Nom"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Prenom *</Text>
            <TextInput
              style={styles.input}
              value={form.prenom}
              onChangeText={value => updateForm('prenom', value)}
              placeholder="Prenom"
            />
          </View>
        </View>

        <Text style={styles.label}>Genre *</Text>
        <View style={styles.genderRow}>
          <Pressable
            style={[
              styles.genderChip,
              form.genre === 'M' && styles.genderChipActive,
            ]}
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
            style={[
              styles.genderChip,
              form.genre === 'F' && styles.genderChipActive,
            ]}
            onPress={() => updateForm('genre', 'F')}>
            <Text
              style={[
                styles.genderChipText,
                form.genre === 'F' && styles.genderChipTextActive,
              ]}>
              Feminin
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Date de delivrance *</Text>
        <TextInput
          style={styles.input}
          value={form.dateDelivrance}
          onChangeText={value => updateForm('dateDelivrance', value)}
          placeholder="JJ/MM/AAAA"
        />

        <Text style={styles.label}>Numero document *</Text>
        <TextInput
          style={styles.input}
          value={form.numeroDocument}
          onChangeText={value => updateForm('numeroDocument', value)}
          placeholder="CNIB, passeport..."
        />

        <Text style={styles.label}>Contact</Text>
        <TextInput
          style={styles.input}
          value={form.contact}
          onChangeText={value => updateForm('contact', value)}
          placeholder="Telephone"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Motif de la visite</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={form.motif}
          onChangeText={value => updateForm('motif', value)}
          placeholder="Optionnel"
          multiline
        />

        <Pressable style={styles.primaryButton} onPress={submitVisit}>
          <Text style={styles.primaryButtonText}>Enregistrer la visite</Text>
        </Pressable>
      </View>
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
    gap: 4,
    paddingBottom: 4,
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
  sectionTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
  },
  helperText: {
    color: '#64748b',
    fontSize: 12,
  },
  scanHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  scanTextBlock: {
    flex: 1,
    gap: 2,
  },
  scanHelp: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  scanStatus: {
    borderRadius: 8,
    backgroundColor: '#ecfeff',
    borderWidth: 1,
    borderColor: '#99f6e4',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  scanStatusText: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  field: {
    flex: 1,
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
  textarea: {
    minHeight: 82,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderChip: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  genderChipActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  genderChipText: {
    color: '#0369a1',
    fontWeight: '700',
  },
  genderChipTextActive: {
    color: '#ffffff',
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0f766e',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 42,
    minWidth: 128,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0284c7',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
  },
  secondaryButtonDisabled: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    color: '#0369a1',
    fontSize: 13,
    fontWeight: '800',
  },
});
