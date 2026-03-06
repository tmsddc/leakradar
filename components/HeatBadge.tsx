import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, FONT } from '../constants/theme';
import { HEAT_CONFIG, type HeatLevel } from '../lib/heat';

interface HeatBadgeProps {
  heat: HeatLevel;
}

export function HeatBadge({ heat }: HeatBadgeProps) {
  const config = HEAT_CONFIG[heat];

  return (
    <View style={[styles.badge, { backgroundColor: `${config.color}22`, borderColor: `${config.color}44` }]}>
      <Text style={styles.text}>
        {config.emoji} {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: FONT.semibold,
  },
});
