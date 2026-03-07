import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS } from '../constants/theme';
import { useLeakStore } from '../store/useLeakStore';
import type { SortOption } from '../store/useLeakStore';

const OPTIONS: {
  value: SortOption;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'hot', label: 'Hot', icon: 'flame-outline',     iconActive: 'flame'          },
  { value: 'new', label: 'New', icon: 'time-outline',      iconActive: 'time'           },
  { value: 'top', label: 'Top', icon: 'arrow-up-outline',  iconActive: 'arrow-up'       },
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
            <Ionicons
              name={active ? opt.iconActive : opt.icon}
              size={14}
              color={active ? COLORS.accent : COLORS.textMuted}
            />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    gap: 5,
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
