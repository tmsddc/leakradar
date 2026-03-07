import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RADIUS, FONT } from '../constants/theme';
import { HEAT_CONFIG, type HeatLevel } from '../lib/heat';

interface HeatBadgeProps {
  heat: HeatLevel;
}

export function HeatBadge({ heat }: HeatBadgeProps) {
  const { label, color } = HEAT_CONFIG[heat];
  return (
    <View style={[styles.badge, { borderColor: `${color}40`, backgroundColor: `${color}16` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  text: {
    fontSize: 10,
    fontWeight: FONT.bold,
    letterSpacing: 0.5,
  },
});
