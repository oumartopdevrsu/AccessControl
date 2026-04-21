import { getRealm } from '../database/realm';
import { DIRECTIONS } from '../constants/directions';

export const initDirections = async () => {
  const realm = await getRealm();

  const existingDirections = realm.objects('ServiceDirection');

  if (existingDirections.length > 0) {
    console.log('Les directions existent déjà dans Realm');
    return;
  }

  realm.write(() => {
    DIRECTIONS.forEach(direction => {
      realm.create('ServiceDirection', direction);
    });
  });

  console.log('Directions insérées avec succès dans Realm');
};