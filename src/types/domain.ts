export type ServiceDirection = {
  code: string;
  libelle: string;
};

export type Visit = {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance?: string | null;
  numeroDocument: string;
  contact: string;
  motif?: string | null;
  codeServiceDirection: string;
  date: string;
  heureEntree: string;
  heureSortie?: string | null;
  synced: boolean;
};

export type VisitForm = {
  nom: string;
  prenom: string;
  dateNaissance: string;
  numeroDocument: string;
  contact: string;
  motif: string;
  codeServiceDirection: string;
};

export const EMPTY_VISIT_FORM: VisitForm = {
  nom: '',
  prenom: '',
  dateNaissance: '',
  numeroDocument: '',
  contact: '',
  motif: '',
  codeServiceDirection: '',
};
