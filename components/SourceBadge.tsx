import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, FONT } from '../constants/theme';

interface SourceBadgeProps {
  source: string;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  const isReddit = source.startsWith('r/');
  return (
    <View style={[styles.badge, isReddit ? styles.redditBadge : styles.newsBadge]}>
      <Text style={[styles.text, isReddit ? styles.redditText : styles.newsText]}>
        {source}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    marginRight: 6,
    marginBottom: 4,
    borderWidth: 1,
  },
  redditBadge: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  newsBadge: {
    backgroundColor: 'rgba(61,133,245,0.08)',
    borderColor: 'rgba(61,133,245,0.2)',
  },
  text: {
    fontSize: 10,
    fontWeight: FONT.medium,
  },
  redditText: {
    color: COLORS.textSecondary,
  },
  newsText: {
    color: COLORS.accent,
  },
});
