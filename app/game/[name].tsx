import React, { useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW } from '../../constants/theme';
import { useLeakStore } from '../../store/useLeakStore';
import { LeakCard } from '../../components/LeakCard';
import { GradientBackground } from '../../components/GradientBackground';
import type { LeakPost } from '../../lib/api';

// Announcement probability score (0-99)
// Based on avg credibility, source diversity, recency, and volume
function calcAnnouncementScore(posts: LeakPost[]): number {
  if (posts.length === 0) return 0;
  const avgCred = posts.reduce((s, p) => s + p.credibility, 0) / posts.length;
  const uniqueSources = new Set(posts.flatMap(p => p.sources)).size;
  const now = Date.now() / 1000;
  const recent = posts.filter(p => now - p.timestamp < 30 * 24 * 3600).length;
  const recentRatio = recent / posts.length;
  const score =
    (avgCred / 100) * 40 +
    Math.min(uniqueSources / 5, 1) * 30 +
    recentRatio * 20 +
    Math.min(posts.length / 8, 1) * 10;
  return Math.round(Math.min(99, score));
}

function scoreLabel(score: number): string {
  if (score >= 75) return 'Very Likely';
  if (score >= 55) return 'Probable';
  if (score >= 35) return 'Possible';
  return 'Unlikely';
}

export default function GameDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const posts = useLeakStore(s => s.posts);

  const gamePosts = useMemo(() => {
    const lowerName = (name ?? '').toLowerCase();
    return [...posts]
      .filter(p =>
        p.tags.some(t => t.toLowerCase() === lowerName) ||
        p.title.toLowerCase().includes(lowerName)
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [posts, name]);

  const announcementScore = useMemo(() => calcAnnouncementScore(gamePosts), [gamePosts]);

  const avgCredibility = gamePosts.length > 0
    ? Math.round(gamePosts.reduce((s, p) => s + p.credibility, 0) / gamePosts.length)
    : 0;

  const uniqueSources = new Set(gamePosts.flatMap(p => p.sources)).size;

  // Trend: last 7 days vs prior 7 days
  const now = Date.now() / 1000;
  const last7 = gamePosts.filter(p => now - p.timestamp < 7 * 24 * 3600).length;
  const prev7 = gamePosts.filter(p =>
    now - p.timestamp >= 7 * 24 * 3600 && now - p.timestamp < 14 * 24 * 3600
  ).length;
  const trend = last7 > prev7 ? 'rising' : last7 < prev7 ? 'falling' : 'stable';

  const scoreColor =
    announcementScore >= 70 ? COLORS.green :
    announcementScore >= 40 ? COLORS.amber :
    COLORS.textSecondary;

  const trendIcon = trend === 'rising' ? 'trending-up' : trend === 'falling' ? 'trending-down' : 'remove';
  const trendColor = trend === 'rising' ? COLORS.green : trend === 'falling' ? COLORS.red : COLORS.textMuted;

  return (
    <GradientBackground>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={gamePosts}
        keyExtractor={p => p.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={() => (
          <View style={styles.statsBlock}>

            {/* Announcement score card */}
            <View style={styles.scoreCard}>
              <Text style={styles.scoreCardLabel}>Announcement Probability</Text>
              <View style={styles.scoreCardBody}>
                <View>
                  <Text style={[styles.scoreValue, { color: scoreColor }]}>
                    {announcementScore}%
                  </Text>
                  <Text style={[styles.scoreVerdict, { color: scoreColor }]}>
                    {scoreLabel(announcementScore)}
                  </Text>
                </View>
                <View style={styles.scoreMeterWrap}>
                  <View style={styles.scoreMeterBg}>
                    <View
                      style={[
                        styles.scoreMeterFill,
                        { width: `${announcementScore}%` as any, backgroundColor: scoreColor },
                      ]}
                    />
                  </View>
                  <Text style={styles.scoreMeterNote}>
                    Based on {gamePosts.length} leak{gamePosts.length !== 1 ? 's' : ''} across {uniqueSources} source{uniqueSources !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>

            {/* Stats row */}
            <View style={styles.statRow}>
              <StatBox
                icon="document-text-outline"
                label="Leaks"
                value={String(gamePosts.length)}
              />
              <StatBox
                icon="shield-checkmark-outline"
                label="Avg Cred"
                value={`${avgCredibility}%`}
                valueColor={avgCredibility >= 70 ? COLORS.green : avgCredibility >= 45 ? COLORS.amber : COLORS.red}
              />
              <StatBox
                icon="globe-outline"
                label="Sources"
                value={String(uniqueSources)}
              />
              <StatBox
                icon={trendIcon}
                label="Trend"
                value={trend === 'rising' ? '↑ Up' : trend === 'falling' ? '↓ Down' : '— Flat'}
                valueColor={trendColor}
                iconColor={trendColor}
              />
            </View>

            {/* Timeline label */}
            {gamePosts.length > 0 ? (
              <Text style={styles.timelineLabel}>Leak Timeline</Text>
            ) : null}
          </View>
        )}
        renderItem={({ item }) => <LeakCard post={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={44} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No leaks found</Text>
            <Text style={styles.emptySubtext}>
              No leaked information about "{name}" in the current feed.{'\n'}Try refreshing.
            </Text>
          </View>
        }
      />
    </GradientBackground>
  );
}

function StatBox({
  icon, label, value, valueColor, iconColor,
}: {
  icon: any;
  label: string;
  value: string;
  valueColor?: string;
  iconColor?: string;
}) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={17} color={iconColor ?? COLORS.accent} />
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: FONT.bold,
    letterSpacing: -0.4,
    flex: 1,
    textAlign: 'center',
  },
  statsBlock: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  scoreCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 10,
    ...SHADOW.card,
  },
  scoreCardLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: FONT.heavy,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  scoreCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: FONT.black,
    letterSpacing: -2,
    lineHeight: 52,
  },
  scoreVerdict: {
    fontSize: 12,
    fontWeight: FONT.bold,
    letterSpacing: 0.2,
    marginTop: 2,
  },
  scoreMeterWrap: {
    flex: 1,
    gap: 8,
  },
  scoreMeterBg: {
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  scoreMeterFill: {
    height: 8,
    borderRadius: RADIUS.pill,
  },
  scoreMeterNote: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONT.medium,
    lineHeight: 15,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: FONT.bold,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: FONT.medium,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  timelineLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: FONT.heavy,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 36,
    gap: 10,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: FONT.bold,
    marginTop: 4,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
