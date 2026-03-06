import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, FONT } from '../constants/theme';

interface SourceBadgeProps {
  source: string;
}

function getSourceEmoji(source: string): string {
  if (source.startsWith('r/')) return '🔴';
  return '🌐';
}

export function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>
        {getSourceEmoji(source)} {source}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 6,
    marginBottom: 4,
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: FONT.medium,
  },
});
