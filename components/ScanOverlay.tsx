import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView } from 'react-native';
import { COLORS, RADIUS, FONT } from '../constants/theme';
import { GlassPanel } from './GlassPanel';
import { useLeakStore } from '../store/useLeakStore';

const STATUS_SYMBOL: Record<string, string> = {
  scanning: '·',
  done: '✓',
  error: '×',
};

export function ScanOverlay() {
  const isScanning = useLeakStore(s => s.isScanning);
  const scanLogs = useLeakStore(s => s.scanLogs);

  if (!isScanning) return null;

  // Count total expected sources dynamically from logs started so far
  const totalSources = scanLogs.length || 1;
  const totalDone = scanLogs.filter(l => l.status !== 'scanning').length;
  const progress = Math.min(totalDone / totalSources, 1);

  return (
    <View style={styles.overlay}>
      <GlassPanel style={styles.panel}>
        <View style={styles.header}>
          <ActivityIndicator size="small" color={COLORS.accent} />
          <Text style={styles.title}>Scanning sources</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>
        <Text style={styles.progressText}>
          {totalDone} / {totalSources} sources
        </Text>

        <ScrollView style={styles.log} nestedScrollEnabled>
          {scanLogs.slice(-6).map((log, i) => (
            <View key={i} style={styles.logRow}>
              <Text style={[
                styles.logStatus,
                log.status === 'done' && styles.logDone,
                log.status === 'error' && styles.logError,
              ]}>
                {STATUS_SYMBOL[log.status] ?? '·'}
              </Text>
              <Text style={styles.logText} numberOfLines={1}>
                {log.source}
                {log.count !== undefined ? `  ${log.count} posts` : ''}
                {log.message ? `  ${log.message}` : ''}
              </Text>
            </View>
          ))}
        </ScrollView>
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 100,
    padding: 24,
  },
  panel: { width: '100%', maxWidth: 360 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: FONT.bold,
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
  },
  progressText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONT.medium,
    marginBottom: 12,
  },
  log: { maxHeight: 120 },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    gap: 8,
  },
  logStatus: {
    fontSize: 12,
    fontWeight: FONT.bold,
    color: COLORS.textMuted,
    width: 12,
    textAlign: 'center',
  },
  logDone: { color: COLORS.green },
  logError: { color: COLORS.red },
  logText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    flex: 1,
  },
});
