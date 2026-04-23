import Realm from 'realm';

export const copyRealmObject = <T,>(item: Realm.Object) =>
  JSON.parse(JSON.stringify(item)) as T;
