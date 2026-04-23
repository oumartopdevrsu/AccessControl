import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ServiceDirection } from '../types/domain';

type Props = {
  items: ServiceDirection[];
  value: string;
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

      {items.map(item => (
        <Pressable
          key={item.code}
          style={[styles.chip, value === item.code && styles.chipActive]}
          onPress={() => onChange(item.code)}>
          <View style={styles.chipContent}>
            <Text
              style={[
                styles.chipCode,
                value === item.code && styles.chipTextActive,
              ]}>
              {item.code}
            </Text>
            <Text
              style={[
                styles.chipText,
                value === item.code && styles.chipTextActive,
              ]}>
              {item.libelle}
            </Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chips: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    minHeight: 52,
    maxWidth: 240,
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
  },
  chipContent: {
    gap: 2,
  },
  chipCode: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '900',
  },
  chipActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  chipText: {
    color: '#1e3a8a',
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#ffffff',
  },
});
