import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS } from '../constants/theme';
import type { TrendingGame } from '../lib/trending';
import { useLeakStore } from '../store/useLeakStore';

interface Props {
  game: TrendingGame;
  rank: number;
}

function getMomentumColor(m: number): string {
  if (m >= 70) return COLORS.red;
  if (m >= 45) return COLORS.amber;
  return COLORS.accent;
}

export function TrendingGameCard({ game, rank }: Props) {
  const router = useRouter();
  const trackedGames = useLeakStore(s => s.trackedGames);
  const toggleTrackGame = useLeakStore(s => s.toggleTrackGame);
  const isTracked = trackedGames.includes(game.name);
  const color = getMomentumColor(game.momentum);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/game/[name]', params: { name: game.name } })}
      activeOpacity={0.75}
    >
      <View style={styles.left}>
        <Text style={styles.rank}>#{rank}</Text>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{game.name}</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.textMuted} />
          </View>
          <Text style={styles.meta}>
            {game.postCount} posts · {game.hotCount} hot
            {game.recentCount > 0 ? ` · ${game.recentCount} recent` : ''}
          </Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${game.momentum}%` as any, backgroundColor: color }]} />
          </View>
        </View>
      </View>
      <View style={styles.right}>
        <View style={[styles.momentumBadge, { borderColor: `${color}44`, backgroundColor: `${color}16` }]}>
          <Text style={[styles.momentumText, { color }]}>{game.momentum}</Text>
        </View>
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation?.(); toggleTrackGame(game.name); }}
          style={styles.trackBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isTracked ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={isTracked ? COLORS.accent : COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rank: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: FONT.heavy,
    width: 28,
    textAlign: 'center',
  },
  info: { flex: 1, gap: 3 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: FONT.bold,
  },
  meta: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  barTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 1,
    overflow: 'hidden',
    marginTop: 3,
  },
  barFill: { height: '100%' },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  momentumBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentumText: {
    fontSize: 11,
    fontWeight: FONT.heavy,
  },
  trackBtn: { padding: 4 },
  trackIcon: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
  trackIconActive: {
    color: COLORS.accent,
  },
});
