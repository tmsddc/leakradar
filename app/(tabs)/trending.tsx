import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, RADIUS, SHADOW } from '../../constants/theme';
import { GradientBackground } from '../../components/GradientBackground';
import { GlassPanel } from '../../components/GlassPanel';
import { TrendingGameCard } from '../../components/TrendingGameCard';
import { useLeakStore } from '../../store/useLeakStore';
import { getTrendingGames, getSourceStats } from '../../lib/trending';

export default function TrendingScreen() {
  const insets = useSafeAreaInsets();
  const posts = useLeakStore(s => s.posts);
  const trackedGames = useLeakStore(s => s.trackedGames);

  const trendingGames = useMemo(() => getTrendingGames(posts), [posts]);
  const sourceStats = useMemo(() => getSourceStats(posts), [posts]);

  const hotCount = posts.filter(p => p.heat === 'hot').length;
  const confirmedCount = posts.filter(p => p.verificationStatus === 'confirmed').length;
  const avgCredibility = posts.length
    ? Math.round(posts.reduce((s, p) => s + p.credibility, 0) / posts.length)
    : 0;

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 8, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>📈 Trending</Text>
        <Text style={styles.subtitle}>Live analysis · {posts.length} leaks indexed</Text>

        {/* Summary stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{hotCount}</Text>
            <Text style={styles.statLabel}>🔥 Hot</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{confirmedCount}</Text>
            <Text style={styles.statLabel}>✓ Confirmed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{avgCredibility}%</Text>
            <Text style={styles.statLabel}>Avg Cred.</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{trackedGames.length}</Text>
            <Text style={styles.statLabel}>★ Tracked</Text>
          </View>
        </View>

        {/* Trending games */}
        <Text style={styles.sectionTitle}>TRENDING GAMES</Text>
        <GlassPanel style={styles.panel} noPadding>
          {trendingGames.length === 0 ? (
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyText}>Scan the feed first to see trending games</Text>
            </View>
          ) : (
            <View style={styles.panelInner}>
              {trendingGames.map((game, i) => (
                <TrendingGameCard key={game.name} game={game} rank={i + 1} />
              ))}
            </View>
          )}
        </GlassPanel>

        {/* Your tracked games */}
        {trackedGames.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>YOUR TRACKED GAMES</Text>
            <GlassPanel style={styles.panel}>
              <View style={styles.tagsRow}>
                {trackedGames.map(game => (
                  <View key={game} style={styles.trackedTag}>
                    <Text style={styles.trackedTagText}>★ {game}</Text>
                  </View>
                ))}
              </View>
            </GlassPanel>
          </>
        )}

        {/* Source reliability */}
        <Text style={styles.sectionTitle}>SOURCE RELIABILITY</Text>
        <GlassPanel style={styles.panel} noPadding>
          {sourceStats.length === 0 ? (
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyText}>No source data yet</Text>
            </View>
          ) : (
            <View style={styles.panelInner}>
              {sourceStats.map((stat, i) => (
                <View key={stat.name} style={styles.sourceRow}>
                  <View style={styles.sourceLeft}>
                    <Text style={styles.sourceRank}>#{i + 1}</Text>
                    <View>
                      <Text style={styles.sourceName} numberOfLines={1}>{stat.name}</Text>
                      <Text style={styles.sourceMeta}>
                        {stat.totalPosts} posts
                        {stat.confirmedCount > 0 ? ` · ${stat.confirmedCount} confirmed` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.credBadge, { borderColor: getCredColor(stat.avgCredibility) + '44', backgroundColor: getCredColor(stat.avgCredibility) + '18' }]}>
                    <Text style={[styles.credBadgeText, { color: getCredColor(stat.avgCredibility) }]}>
                      {stat.avgCredibility}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </GlassPanel>

        {/* Tips */}
        <GlassPanel style={[styles.panel, styles.tipPanel]}>
          <Text style={styles.tipTitle}>💡 How Credibility Works</Text>
          <Text style={styles.tipText}>
            Each leak is scored based on the source reputation, community engagement, and corroboration across multiple outlets. Track games with ☆ to get personalized alerts.
          </Text>
        </GlassPanel>
      </ScrollView>
    </GradientBackground>
  );
}

function getCredColor(score: number): string {
  if (score >= 80) return '#34d399';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  title: {
    fontSize: 28,
    fontWeight: FONT.black,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: FONT.medium,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingVertical: 12,
    alignItems: 'center',
    ...SHADOW.card,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: FONT.heavy,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: FONT.medium,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: FONT.bold,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
    marginLeft: 2,
  },
  panel: { marginBottom: 20 },
  panelInner: { padding: 16 },
  emptyPanel: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trackedTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.25)',
  },
  trackedTagText: {
    color: COLORS.accentGreen,
    fontSize: 12,
    fontWeight: FONT.semibold,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sourceRank: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: FONT.heavy,
    width: 24,
    textAlign: 'center',
  },
  sourceName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: FONT.semibold,
  },
  sourceMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  credBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    minWidth: 48,
    alignItems: 'center',
  },
  credBadgeText: {
    fontSize: 12,
    fontWeight: FONT.heavy,
  },
  tipPanel: { backgroundColor: 'rgba(52,211,153,0.05)' },
  tipTitle: {
    color: COLORS.accentGreen,
    fontSize: 14,
    fontWeight: FONT.bold,
    marginBottom: 8,
  },
  tipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});
