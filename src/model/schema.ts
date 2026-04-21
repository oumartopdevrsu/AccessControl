import Realm from 'realm'

type MyObjectSchema = {
    name : string;
    properties : {[key : string] : string | Realm.ObjectSchemaProperty};
    primaryKey? : string;
};

//Entité service/direction

export const ServiceSchema : MyObjectSchema = {
    name : 'Service',
    properties : {
        code : 'string',
        libelle : 'string',
    },

    primaryKey : 'code',
};

// Entité visiteur

export const VisiteurSchema : MyObjectSchema = {
    name : 'Visiteur',
    properties : {
        id : 'number',
        nom : 'string',
        prenom : 'string',
        contact : 'string',
        numeroDocument : 'string',
        date : 'date',
        heureEntree : 'date',
        heureSortie : 'date',
        code : 'string',
    },

    primaryKey : 'id',
};

// Entité User
export const UserSchema : MyObjectSchema = {
    name : 'user',
    properties : {
        id : 'number',
        nom : 'string',
        prenom : 'string',
        username : 'string',
        password : 'string',
        
    },

    primaryKey : 'id',
};

const ALL_SCHEMAS = [
    ServiceSchema,
    VisiteurSchema,
    UserSchema
];

export const realmConfig : Realm.Configuration = {
    schema : ALL_SCHEMAS,
    schemaVersion : 1,
};

// Fonction d'ouverture du realm

export const getRealm = () => {
    try{
        let realm = new Realm(realmConfig);
        return realm;
    }
    catch (error){
        console.error("Erreur lors de l'ouverture du realm", error);
        throw error;
    }
};
