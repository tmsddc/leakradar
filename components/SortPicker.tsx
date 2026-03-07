import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT } from '../constants/theme';
import { useLeakStore } from '../store/useLeakStore';
import type { SortOption } from '../store/useLeakStore';

const OPTIONS: {
  value: SortOption;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'hot', label: 'Hot', icon: 'flame-outline',    iconActive: 'flame'        },
  { value: 'new', label: 'New', icon: 'time-outline',     iconActive: 'time'         },
  { value: 'top', label: 'Top', icon: 'arrow-up-outline', iconActive: 'arrow-up'     },
];

interface SortPickerProps {
  style?: ViewStyle;
}

export function SortPicker({ style }: SortPickerProps) {
  const sortOption = useLeakStore(s => s.sortOption);
  const setSortOption = useLeakStore(s => s.setSortOption);

  return (
    <View style={[styles.container, style]}>
      {OPTIONS.map(opt => {
        const active = sortOption === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={styles.option}
            onPress={() => setSortOption(opt.value)}
            activeOpacity={0.6}
          >
            <Ionicons
              name={active ? opt.iconActive : opt.icon}
              size={13}
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
    alignItems: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 5,
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
