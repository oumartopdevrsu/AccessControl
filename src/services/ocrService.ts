import MlkitOcr from 'react-native-mlkit-ocr';
import { launchCamera } from 'react-native-image-picker';
import { VisitForm } from '../types/domain';

type OcrBlock = {
  text: string;
  lines?: OcrLine[];
};

type OcrLine = {
  text: string;
};

type OcrExtraction = Pick<
  VisitForm,
  'nom' | 'prenom' | 'dateDelivrance' | 'numeroDocument'
>;

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[|]/g, ':')
    .replace(/[ \t]+/g, ' ')
    .trim();

const cleanFieldValue = (value: string) =>
  value
    .replace(/^[:\-\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();

const toNormalizedLines = (blocks: OcrBlock[]) =>
  blocks.flatMap(block =>
    (block.lines || [])
      .map(line => normalizeText(line.text))
      .filter(Boolean),
  );

const findStrictLabeledValue = (lines: string[], labels: string[]) => {
  const normalizedLabels = labels.map(label => normalizeText(label).toUpperCase());

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const upperLine = line.toUpperCase();

    for (const label of normalizedLabels) {
      const inlineMatch = upperLine.match(
        new RegExp(`^${label}\\b\\s*[:\\-]?\\s*(.+)$`, 'i'),
      );

      if (inlineMatch?.[1]) {
        return cleanFieldValue(inlineMatch[1]);
      }

      const labelOnlyMatch = upperLine.match(new RegExp(`^${label}\\b\\s*[:\\-]?$`, 'i'));

      if (labelOnlyMatch && lines[index + 1]) {
        return cleanFieldValue(lines[index + 1]);
      }
    }
  }

  return '';
};

const cleanPersonValue = (value: string) =>
  value
    .replace(/[^A-Za-z\s'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const findDeliveryDate = (lines: string[]) => {
  const candidate = findStrictLabeledValue(lines, [
    'Delivree le',
    'Delivree le',
    'Delivre le',
    'Date de delivrance',
    'Date delivrance',
  ]);
  return candidate.match(/\b\d{2}[./-]\d{2}[./-]\d{4}\b/)?.[0] || '';
};

const findCnibNumber = (lines: string[]) => {
  const combined = lines.join(' ').toUpperCase();
  return combined.match(/\b(B\d{7,})\b/)?.[1] || '';
};

const parseCnibText = (blocks: OcrBlock[]): OcrExtraction => {
  const lines = toNormalizedLines(blocks);
  const nom = cleanPersonValue(findStrictLabeledValue(lines, ['Nom'])).toUpperCase();
  const prenom = cleanPersonValue(
    findStrictLabeledValue(lines, ['Prenom', 'Prenoms']),
  );
  const dateDelivrance = findDeliveryDate(lines);
  const numeroDocument = findCnibNumber(lines);

  return {
    nom,
    prenom,
    dateDelivrance,
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

  return parseCnibText(blocks);
};
