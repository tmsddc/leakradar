import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, FONT, SHADOW } from '../constants/theme';
import { GlassPanel } from './GlassPanel';
import { useLeakStore } from '../store/useLeakStore';

export function ScanOverlay() {
  const isScanning = useLeakStore(s => s.isScanning);
  const scanLogs = useLeakStore(s => s.scanLogs);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!isScanning) return;
    const spin = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
      ])
    );
    spin.start();
    pulse.start();
    return () => { spin.stop(); pulse.stop(); };
  }, [isScanning]);

  if (!isScanning) return null;

  const totalSources = scanLogs.length || 1;
  const totalDone = scanLogs.filter(l => l.status !== 'scanning').length;
  const progress = Math.min(totalDone / totalSources, 1);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.overlay}>
      <GlassPanel style={styles.panel}>
        {/* Header with animated radar icon */}
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
            <Ionicons name="radar-outline" size={22} color={COLORS.accent} />
          </Animated.View>
          <Text style={styles.title}>Scanning sources</Text>
          <Text style={styles.counter}>{totalDone}/{totalSources}</Text>
        </View>

        {/* Progress bar with neon glow */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` as any, opacity: pulseAnim }]} />
          <View style={[styles.progressFillBase, { width: `${progress * 100}%` as any }]} />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progress * 100)}% complete
        </Text>

        {/* Log entries */}
        <View style={styles.log}>
          {scanLogs.slice(-6).map((log, i) => (
            <View key={i} style={styles.logRow}>
              <View style={[
                styles.logIcon,
                log.status === 'done' && styles.logIconDone,
                log.status === 'error' && styles.logIconError,
              ]}>
                <Ionicons
                  name={log.status === 'done' ? 'checkmark' : log.status === 'error' ? 'close' : 'ellipse'}
                  size={log.status === 'scanning' ? 6 : 10}
                  color={log.status === 'done' ? COLORS.neonGreen : log.status === 'error' ? COLORS.neonRed : COLORS.textMuted}
                />
              </View>
              <Text style={[
                styles.logText,
                log.status === 'done' && { color: COLORS.textSecondary },
              ]} numberOfLines={1}>
                {log.source}
                {log.count !== undefined ? ` · ${log.count} posts` : ''}
                {log.message ? ` · ${log.message}` : ''}
              </Text>
            </View>
          ))}
        </View>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    zIndex: 100,
    padding: 24,
  },
  panel: { width: '100%', maxWidth: 360, ...SHADOW.glass },
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
    flex: 1,
  },
  counter: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: FONT.bold,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    top: 0, left: 0,
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  progressFillBase: {
    position: 'absolute',
    top: 0, left: 0,
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
    opacity: 0.5,
  },
  progressText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: FONT.medium,
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  log: { gap: 2 },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  logIcon: {
    width: 18, height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logIconDone: {
    backgroundColor: `${COLORS.neonGreen}18`,
  },
  logIconError: {
    backgroundColor: `${COLORS.neonRed}18`,
  },
  logText: {
    color: COLORS.textMuted,
    fontSize: 11,
    flex: 1,
    fontWeight: FONT.medium,
  },
});
