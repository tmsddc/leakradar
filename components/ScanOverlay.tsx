import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView } from 'react-native';
import { COLORS, RADIUS, FONT, SPACING } from '../constants/theme';
import { GlassPanel } from './GlassPanel';
import { useLeakStore } from '../store/useLeakStore';

export function ScanOverlay() {
  const isScanning = useLeakStore(s => s.isScanning);
  const scanLogs = useLeakStore(s => s.scanLogs);

  if (!isScanning) return null;

  const totalDone = scanLogs.filter(l => l.status === 'done').length;
  const totalSources = 13; // 7 subreddits + 6 RSS
  const progress = totalDone / totalSources;

  return (
    <View style={styles.overlay}>
      <GlassPanel style={styles.panel}>
        <View style={styles.header}>
          <ActivityIndicator size="small" color={COLORS.accentCyan} />
          <Text style={styles.title}>Scanning Sources...</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {totalDone} / {totalSources} sources scanned
        </Text>

        {/* Log */}
        <ScrollView style={styles.logContainer} nestedScrollEnabled>
          {scanLogs.slice(-6).map((log, i) => (
            <View key={i} style={styles.logRow}>
              <Text style={styles.logIcon}>
                {log.status === 'scanning' ? '⏳' : log.status === 'done' ? '✅' : '❌'}
              </Text>
              <Text style={styles.logText} numberOfLines={1}>
                {log.source}
                {log.count !== undefined ? ` — ${log.count} posts` : ''}
                {log.message ? ` — ${log.message}` : ''}
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
    padding: 24,
  },
  panel: {
    width: '100%',
    maxWidth: 360,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: FONT.bold,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accentCyan,
    borderRadius: 2,
  },
  progressText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: FONT.medium,
    marginBottom: 12,
  },
  logContainer: {
    maxHeight: 120,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    gap: 6,
  },
  logIcon: {
    fontSize: 12,
  },
  logText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: FONT.regular,
    flex: 1,
  },
});
