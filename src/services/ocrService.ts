import MlkitOcr from 'react-native-mlkit-ocr';
import { launchCamera } from 'react-native-image-picker';
import { VisitForm } from '../types/domain';

type OcrBlock = {
  text: string;
};

type OcrExtraction = Pick<
  VisitForm,
  'nom' | 'prenom' | 'dateNaissance' | 'numeroDocument'
>;

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const findLabeledValue = (text: string, label: string) => {
  const regex = new RegExp(`${label}\\s*[:\\-]?\\s*([^\\n]+)`, 'i');
  return text.match(regex)?.[1]?.trim() || '';
};

const findDate = (text: string) =>
  text.match(/\b(\d{2}[/.-]\d{2}[/.-]\d{4})\b/)?.[1] || '';

const findDocumentNumber = (text: string) => {
  const cnibLine =
    text.match(/\b(?:CNIB|NUI|NUMERO)[^\n:]*[:-]?\s*([A-Z0-9-]{5,})\b/i)?.[1] ||
    '';

  if (cnibLine) {
    return cnibLine;
  }

  const fallback = text.match(/\b([A-Z]{0,3}-?[A-Z0-9]{6,})\b/);
  return fallback?.[1] || '';
};

const cleanPersonValue = (value: string) =>
  value
    .replace(/[^A-Za-z\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const parseCnibText = (rawText: string): OcrExtraction => {
  const normalized = normalizeText(rawText);
  const upper = normalized.toUpperCase();

  const nom =
    cleanPersonValue(findLabeledValue(upper, 'NOM')) ||
    cleanPersonValue(findLabeledValue(upper, 'NAME'));
  const prenom =
    cleanPersonValue(findLabeledValue(upper, 'PRENOM')) ||
    cleanPersonValue(findLabeledValue(upper, 'GIVEN NAME'));
  const dateNaissance =
    findLabeledValue(normalized, 'Date de naissance') ||
    findLabeledValue(normalized, 'Ne le') ||
    findDate(normalized);
  const numeroDocument = findDocumentNumber(upper);

  return {
    nom,
    prenom,
    dateNaissance,
    numeroDocument,
  };
};

export const scanCnib = async () => {
  const response = await launchCamera({
    mediaType: 'photo',
    cameraType: 'back',
    quality: 0.8,
    maxWidth: 2200,
    maxHeight: 2200,
    saveToPhotos: false,
  });

  if (response.didCancel) {
    return null;
  }

  if (response.errorCode || response.errorMessage) {
    throw new Error(response.errorMessage || "Impossible d'ouvrir la camera.");
  }

  const asset = response.assets?.[0];
  const imageUri = asset?.uri;

  if (!imageUri) {
    throw new Error("Aucune image n'a ete capturee.");
  }

  const blocks = (await MlkitOcr.detectFromUri(imageUri)) as OcrBlock[];
  const text = blocks.map(block => block.text).join('\n').trim();

  if (!text) {
    throw new Error("Aucun texte n'a ete detecte sur la photo.");
  }

  return parseCnibText(text);
};
