export type ServiceDirection = {
  code: string;
  libelle: string;
  serverId?: number | null;
  active?: boolean;
};

export type Visit = {
  id: string;
  mobileRef: string;
  serverId?: number | null;
  nom: string;
  prenom: string;
  genre: 'M' | 'F';
  dateDelivrance?: string | null;
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
  genre: 'M' | 'F' | '';
  dateDelivrance: string;
  numeroDocument: string;
  contact: string;
  motif: string;
  codeServiceDirection: string;
};

export const EMPTY_VISIT_FORM: VisitForm = {
  nom: '',
  prenom: '',
  genre: '',
  dateDelivrance: '',
  numeroDocument: '',
  contact: '',
  motif: '',
  codeServiceDirection: '',
};
