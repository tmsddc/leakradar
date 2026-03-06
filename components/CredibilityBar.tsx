import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT, RADIUS } from '../constants/theme';

interface Props {
  score: number; // 0-100
  showLabel?: boolean;
  compact?: boolean;
}

function getColor(score: number): string {
  if (score >= 80) return '#34d399';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function getLabel(score: number): string {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  if (score >= 40) return 'Low';
  return 'Very Low';
}

export function CredibilityBar({ score, showLabel = true, compact = false }: Props) {
  const color = getColor(score);
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.compactText, { color }]}>{score}%</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>Credibility</Text>
          <Text style={[styles.score, { color }]}>{score}% · {getLabel(score)}</Text>
        </View>
      )}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${score}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: FONT.medium,
  },
  score: {
    fontSize: 12,
    fontWeight: FONT.bold,
  },
  track: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compactText: {
    fontSize: 10,
    fontWeight: FONT.bold,
  },
});
