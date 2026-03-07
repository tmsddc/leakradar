import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, FONT } from '../constants/theme';
import { HEAT_CONFIG, type HeatLevel } from '../lib/heat';

interface HeatBadgeProps {
  heat: HeatLevel;
}

const HEAT_ICONS: Record<HeatLevel, keyof typeof Ionicons.glyphMap> = {
  hot:    'flame',
  rising: 'trending-up',
  new:    'time-outline',
};

export function HeatBadge({ heat }: HeatBadgeProps) {
  const { label, color } = HEAT_CONFIG[heat];

  return (
    <View style={[styles.badge, { borderColor: `${color}40`, backgroundColor: `${color}16` }]}>
      <Ionicons name={HEAT_ICONS[heat]} size={11} color={color} />
      <Text style={[styles.text, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: FONT.bold,
    letterSpacing: 0.4,
  },
});
