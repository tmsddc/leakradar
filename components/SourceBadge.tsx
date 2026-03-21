import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, FONT } from '../constants/theme';

interface SourceBadgeProps {
  source: string;
}

const SOURCE_COLORS: Record<string, string> = {
  'r/GamingLeaksAndRumours': COLORS.neonOrange,
  'r/PS5': COLORS.catPlayStation,
  'r/XboxSeriesX': COLORS.catXbox,
  'r/NintendoSwitch': COLORS.catNintendo,
  'r/pcgaming': COLORS.catPC,
};

export function SourceBadge({ source }: SourceBadgeProps) {
  const isReddit = source.startsWith('r/');
  const accentColor = SOURCE_COLORS[source] ?? (isReddit ? COLORS.neonPurple : COLORS.neonBlue);

  return (
    <View style={[styles.badge, { borderColor: `${accentColor}30`, backgroundColor: `${accentColor}10` }]}>
      <Ionicons
        name={isReddit ? 'logo-reddit' : 'newspaper-outline'}
        size={10}
        color={accentColor}
      />
      <Text style={[styles.text, { color: accentColor }]} numberOfLines={1}>
        {source}
      </Text>
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
    borderRadius: RADIUS.pill,
    marginRight: 6,
    marginBottom: 4,
    borderWidth: 1,
  },
  text: {
    fontSize: 10,
    fontWeight: FONT.semibold,
  },
});
