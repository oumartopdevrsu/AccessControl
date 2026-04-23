import React, { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ServiceDirectionChips } from '../components/ServiceDirectionChips';
import { getServiceDirections } from '../services/serviceDirectionService';
import { scanCnib } from '../services/ocrService';
import { createVisit } from '../services/visitService';
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
        dateNaissance: extracted.dateNaissance || current.dateNaissance,
        numeroDocument: extracted.numeroDocument || current.numeroDocument,
      }));

      const extractedFields = [
        extracted.nom && 'nom',
        extracted.prenom && 'prenom',
        extracted.dateNaissance && 'date de naissance',
        extracted.numeroDocument && 'numero document',
      ].filter(Boolean);

      if (extractedFields.length === 0) {
        setScanStatus(
          'Photo prise, mais aucune information exploitable n a ete reconnue.',
        );
        Alert.alert(
          'Scan CNIB',
          "La photo a ete prise, mais l'OCR n'a pas reconnu les informations attendues.",
        );
        return;
      }

      setScanStatus(
        `Scan termine : ${extractedFields.join(', ')} renseigne(s). Le contact reste a saisir manuellement.`,
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
    if (!form.nom.trim() || !form.prenom.trim() || !form.numeroDocument.trim()) {
      Alert.alert(
        'Champs requis',
        'Le nom, le prenom et le numero du document sont obligatoires.',
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
        {/* <Text style={styles.subtitle}>Fonctionne aussi hors ligne</Text> */}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Direction ou service visite</Text>
        <Text style={styles.label}>Service ou direction</Text>
        <ServiceDirectionChips
          items={directions}
          value={form.codeServiceDirection}
          onChange={value => updateForm('codeServiceDirection', value)}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.scanHeader}>
          <View style={styles.scanTextBlock}>
            <Text style={styles.sectionTitle}>Scan document</Text>
            <Text style={styles.scanHelp}>
              Scanner la CNIB pour recuperer nom, prenom, date de naissance et
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
            <Text style={styles.label}>Nom</Text>
            <TextInput
              style={styles.input}
              value={form.nom}
              autoCapitalize="characters"
              onChangeText={value => updateForm('nom', value)}
              placeholder="Nom"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Prenom</Text>
            <TextInput
              style={styles.input}
              value={form.prenom}
              onChangeText={value => updateForm('prenom', value)}
              placeholder="Prenom"
            />
          </View>
        </View>

        <Text style={styles.label}>Date de naissance</Text>
        <TextInput
          style={styles.input}
          value={form.dateNaissance}
          onChangeText={value => updateForm('dateNaissance', value)}
          placeholder="JJ/MM/AAAA"
        />

        <Text style={styles.label}>Numero document</Text>
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
    backgroundColor: '#f6f7f9',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    gap: 4,
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
  subtitle: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
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
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
  },
  scanStatus: {
    borderRadius: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  scanStatusText: {
    color: '#166534',
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
  textarea: {
    minHeight: 82,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#14532d',
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
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0f766e',
    paddingHorizontal: 10,
  },
  secondaryButtonDisabled: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '800',
  },
});
