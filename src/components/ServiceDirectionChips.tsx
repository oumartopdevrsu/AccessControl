/**
 * Sélecteur de service/direction sous forme de chips défilants.
 *
 * Chaque chip affiche le code (court) et le libellé (complet) du service.
 * Un chip "Tous" optionnel permet de retirer le filtre.
 */

import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {ServiceDirection} from '../types/domain';
import {Colors, FontSize, Radius, Spacing} from '../theme';

type Props = {
  items: ServiceDirection[];
  /** Code du service actuellement sélectionné (ou 'ALL' si includeAll activé) */
  value: string;
  /** Si true, affiche un chip "Tous" en premier */
  includeAll?: boolean;
  onChange: (value: string) => void;
};

export function ServiceDirectionChips({
  items,
  value,
  includeAll = false,
  onChange,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}>

      {/* Chip "Tous" pour désactiver le filtre de direction */}
      {includeAll && (
        <Pressable
          style={[styles.chip, value === 'ALL' && styles.chipActive]}
          onPress={() => onChange('ALL')}>
          <Text
            style={[styles.chipText, value === 'ALL' && styles.chipTextActive]}>
            Tous
          </Text>
        </Pressable>
      )}

      {items.map(item => {
        const isActive = value === item.code;
        return (
          <Pressable
            key={item.code}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onChange(item.code)}>
            <View style={styles.chipContent}>
              {/* Code court du service en haut */}
              <Text
                style={[styles.chipCode, isActive && styles.chipTextActive]}>
                {item.code}
              </Text>
              {/* Libellé complet en dessous */}
              <Text
                style={[styles.chipLabel, isActive && styles.chipTextActive]}
                numberOfLines={2}>
                {item.libelle}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chips: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: 2,
  },
  chip: {
    maxWidth: 200,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    // Ombre subtile pour donner de la profondeur
    shadowColor: Colors.navy,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipContent: {
    gap: 2,
  },
  chipCode: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  chipLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.xs,
    fontWeight: '600',
    lineHeight: 15,
  },
  // Texte blanc sur chip actif (code + libellé)
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
  // Chip "Tous" — texte centré sur une ligne
  chipText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});
