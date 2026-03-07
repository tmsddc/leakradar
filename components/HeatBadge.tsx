import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, TOKENS } from '../constants/theme';
import type { HeatLevel } from '../lib/heat';

interface HeatBadgeProps {
  heat: HeatLevel;
}

export function HeatBadge({ heat }: HeatBadgeProps) {
  const { color, label } = TOKENS.heat[heat];
  return (
    <View style={[styles.badge, { borderColor: `${color}35`, backgroundColor: `${color}14` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
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
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  text: {
    fontSize: 9,
    fontWeight: FONT.heavy,
    letterSpacing: 0.7,
  },
});
