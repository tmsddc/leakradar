import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT, RADIUS } from '../constants/theme';
import { useLeakStore } from '../store/useLeakStore';
import type { SortOption } from '../store/useLeakStore';

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'hot', label: 'Hot'  },
  { value: 'new', label: 'New'  },
  { value: 'top', label: 'Top'  },
];

export function SortPicker() {
  const sortOption = useLeakStore(s => s.sortOption);
  const setSortOption = useLeakStore(s => s.setSortOption);

  return (
    <View style={styles.container}>
      {OPTIONS.map(opt => {
        const active = sortOption === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.option, active && styles.optionActive]}
            onPress={() => setSortOption(opt.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 3,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  optionActive: {
    backgroundColor: COLORS.accentActive,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: FONT.semibold,
  },
  labelActive: {
    color: COLORS.accent,
  },
});
