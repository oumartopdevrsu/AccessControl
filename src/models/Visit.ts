import Realm from 'realm';

export const VisitSchema: Realm.ObjectSchema = {
  name: 'Visit',
  primaryKey: 'id',
  properties: {
    id: 'string',
    mobileRef: 'string',
    serverId: 'int?',
    nom: 'string',
    prenom: 'string',
    genre: 'string',
    dateDelivrance: 'string?',
    numeroDocument: 'string',
    contact: 'string',
    motif: 'string?',
    codeServiceDirection: 'string',
    date: 'string',
    heureEntree: 'string',
    heureSortie: 'string?',
    synced: {type: 'bool', default: false},
  },
};
