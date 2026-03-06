import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT, RADIUS } from '../constants/theme';
import { useLeakStore } from '../store/useLeakStore';
import type { SortOption } from '../store/useLeakStore';

const OPTIONS: { value: SortOption; label: string; icon: string }[] = [
  { value: 'hot', label: 'Hot', icon: '🔥' },
  { value: 'new', label: 'New', icon: '🆕' },
  { value: 'top', label: 'Top', icon: '▲' },
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
            <Text style={styles.icon}>{opt.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 3,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    gap: 5,
  },
  optionActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  icon: { fontSize: 13 },
  label: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: FONT.semibold,
  },
  labelActive: {
    color: COLORS.accentGreen,
  },
});
