import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT } from '../constants/theme';

interface Props {
  score: number; // 0-100
  showLabel?: boolean;
  compact?: boolean;
}

function getColor(score: number): string {
  if (score >= 80) return COLORS.green;
  if (score >= 60) return COLORS.amber;
  if (score >= 40) return '#f97316';
  return COLORS.red;
}

function getLabel(score: number): string {
  if (score >= 80) return 'Reliable';
  if (score >= 60) return 'Likely';
  if (score >= 40) return 'Rumour';
  return 'Speculative';
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
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONT.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  score: {
    fontSize: 12,
    fontWeight: FONT.bold,
  },
  track: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compactText: {
    fontSize: 12,
    fontWeight: FONT.bold,
  },
});
