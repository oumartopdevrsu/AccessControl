import MlkitOcr from 'react-native-mlkit-ocr';
import {launchCamera} from 'react-native-image-picker';
import {VisitForm} from '../types/domain';

type OcrBlock = {
  text: string;
  lines?: OcrLine[];
};

type OcrLine = {
  text: string;
};

export type OcrExtraction = Pick<
  VisitForm,
  'nom' | 'prenom' | 'dateDelivrance' | 'numeroDocument'
> & {
  rawText: string;
  debugLines: string[];
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[|]/g, ':')
    .replace(/[;]+/g, ':')
    .replace(/[ \t]+/g, ' ')
    .trim();

const normalizeForCompare = (value: string) => normalizeText(value).toUpperCase();

const cleanFieldValue = (value: string) =>
  value
    .replace(/^[:\-\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();

const splitBlockText = (value: string) =>
  value
    .split(/\r?\n/)
    .map(line => normalizeText(line))
    .filter(Boolean);

const toNormalizedLines = (blocks: OcrBlock[]) => {
  const lines = blocks.flatMap(block => {
    const explicitLines = (block.lines || [])
      .map(line => normalizeText(line.text))
      .filter(Boolean);

    if (explicitLines.length > 0) {
      return explicitLines;
    }

    return splitBlockText(block.text || '');
  });

  return Array.from(new Set(lines));
};

const LABEL_STOP_WORDS = [
  'NOM',
  'PRENOM',
  'PRENOMS',
  'NE LE',
  'NEE LE',
  'DELIVREE LE',
  'DELIVRE LE',
  'DATE DE DELIVRANCE',
  'DATE DELIVRANCE',
  'SEXE',
  'GENRE',
  'PROFESSION',
  'CONTACT',
  'ADRESSE',
];

const isAnotherLabelLine = (value: string) => {
  const upper = normalizeForCompare(value);
  return LABEL_STOP_WORDS.some(label => upper.startsWith(label));
};

const extractInlineValue = (line: string, label: string) => {
  const upperLine = normalizeForCompare(line);
  const upperLabel = normalizeForCompare(label);
  const labelIndex = upperLine.indexOf(upperLabel);

  if (labelIndex === -1) {
    return '';
  }

  const remainder = line.slice(labelIndex + label.length);
  return cleanFieldValue(remainder);
};

const collectCandidateValue = (lines: string[], index: number, label: string) => {
  const inlineValue = extractInlineValue(lines[index], label);

  if (inlineValue && inlineValue !== lines[index]) {
    return inlineValue;
  }

  for (let offset = 1; offset <= 2; offset += 1) {
    const nextLine = lines[index + offset];
    if (!nextLine) {
      break;
    }
    if (isAnotherLabelLine(nextLine)) {
      break;
    }

    const cleaned = cleanFieldValue(nextLine);
    if (cleaned) {
      return cleaned;
    }
  }

  return '';
};

const findLabeledValue = (lines: string[], labels: string[]) => {
  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = lines[index];
    const upperLine = normalizeForCompare(currentLine);

    for (const label of labels) {
      const upperLabel = normalizeForCompare(label);

      if (
        upperLine.startsWith(upperLabel) ||
        upperLine.includes(`${upperLabel}:`) ||
        upperLine.includes(`${upperLabel} :`)
      ) {
        const candidate = collectCandidateValue(lines, index, label);
        if (candidate) {
          return candidate;
        }
      }
    }
  }

  return '';
};

const cleanPersonValue = (value: string) =>
  value
    .replace(/[^A-Za-z\s'-]/g, ' ')
    .replace(/\b(CNIB|CARTE|BURKINA|FASO|TAILLE|SEXE|NEE|NE|DELIVREE)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const pickBestName = (value: string, upper = false) => {
  const cleaned = cleanPersonValue(value);
  return upper ? cleaned.toUpperCase() : cleaned;
};

const findDeliveryDate = (lines: string[]) => {
  const candidate = findLabeledValue(lines, [
    'Delivree le',
    'Delivre le',
    'Date de delivrance',
    'Date delivrance',
    'Nee le',
    'Ne le',
  ]);

  return candidate.match(/\b\d{2}[./-]\d{2}[./-]\d{4}\b/)?.[0] || '';
};

const findCnibNumber = (lines: string[]) => {
  const combined = normalizeForCompare(lines.join(' ')).replace(/\s+/g, '');
  const rawMatch = combined.match(/\bB[0-9O]{7,}\b/);

  if (!rawMatch) {
    return '';
  }

  return rawMatch[0].replace(/O/g, '0');
};

const parseCnibText = (blocks: OcrBlock[]): OcrExtraction => {
  const lines = toNormalizedLines(blocks);
  const rawText = lines.join('\n');

  const nom = pickBestName(findLabeledValue(lines, ['Nom']), true);
  const prenom = pickBestName(findLabeledValue(lines, ['Prenom', 'Prenoms']));
  const dateDelivrance = findDeliveryDate(lines);
  const numeroDocument = findCnibNumber(lines);

  return {
    nom,
    prenom,
    dateDelivrance,
    numeroDocument,
    rawText,
    debugLines: lines,
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
  const lines = toNormalizedLines(blocks);

  if (lines.length === 0) {
    throw new Error("Aucun texte n'a ete detecte sur la photo.");
  }

  return parseCnibText(blocks);
};
