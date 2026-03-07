import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, RADIUS } from '../../constants/theme';
import { GradientBackground } from '../../components/GradientBackground';
import { GlassPanel } from '../../components/GlassPanel';
import { TrendingGameCard } from '../../components/TrendingGameCard';
import { useLeakStore } from '../../store/useLeakStore';
import { getTrendingGames, getSourceStats } from '../../lib/trending';

const PLATFORM_CATS = ['PlayStation', 'Xbox', 'Nintendo', 'PC', 'Multi'];
const CAT_COLOR = '#3d85f5'; // use accent for all bars – clean monochrome

function getCredColor(score: number): string {
  if (score >= 80) return COLORS.green;
  if (score >= 60) return COLORS.amber;
  return COLORS.red;
}

export default function TrendingScreen() {
  const insets = useSafeAreaInsets();
  const posts = useLeakStore(s => s.posts);
  const trackedGames = useLeakStore(s => s.trackedGames);
  const toggleTrackGame = useLeakStore(s => s.toggleTrackGame);

  const trendingGames = useMemo(() => getTrendingGames(posts), [posts]);
  const sourceStats   = useMemo(() => getSourceStats(posts), [posts]);

  const hotCount       = posts.filter(p => p.heat === 'hot').length;
  const confirmedCount = posts.filter(p => p.verificationStatus === 'confirmed').length;
  const avgCredibility = posts.length
    ? Math.round(posts.reduce((s, p) => s + p.credibility, 0) / posts.length)
    : 0;

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of posts) counts[p.category] = (counts[p.category] ?? 0) + 1;
    return PLATFORM_CATS
      .map(cat => ({ cat, count: counts[cat] ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  const maxCatCount = Math.max(...categoryBreakdown.map(c => c.count), 1);

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 8, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Trending</Text>
        <Text style={styles.subtitle}>{posts.length} leaks indexed</Text>

        {/* Summary stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{hotCount}</Text>
            <Text style={styles.statLabel}>Hot</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{confirmedCount}</Text>
            <Text style={styles.statLabel}>Confirmed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: getCredColor(avgCredibility) }]}>
              {avgCredibility}%
            </Text>
            <Text style={styles.statLabel}>Avg Cred</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{trackedGames.length}</Text>
            <Text style={styles.statLabel}>Tracked</Text>
          </View>
        </View>

        {/* Platform breakdown */}
        {posts.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>PLATFORM BREAKDOWN</Text>
            <GlassPanel style={styles.panel}>
              {categoryBreakdown.filter(c => c.count > 0).map(({ cat, count }) => (
                <View key={cat} style={styles.catRow}>
                  <Text style={styles.catName}>{cat}</Text>
                  <View style={styles.catBarBg}>
                    <View
                      style={[
                        styles.catBarFill,
                        { width: `${Math.round((count / maxCatCount) * 100)}%` as any },
                      ]}
                    />
                  </View>
                  <Text style={styles.catCount}>{count}</Text>
                </View>
              ))}
            </GlassPanel>
          </>
        ) : null}

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

        {/* Tracked games */}
        {trackedGames.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>YOUR TRACKED GAMES</Text>
            <GlassPanel style={styles.panel}>
              <View style={styles.tagsRow}>
                {trackedGames.map(game => (
                  <TouchableOpacity
                    key={game}
                    style={styles.trackedTag}
                    onPress={() => toggleTrackGame(game)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.trackedTagText}>{game}</Text>
                    <Text style={styles.trackedTagRemove}>×</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.tagHint}>Tap to untrack</Text>
            </GlassPanel>
          </>
        ) : null}

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
                    <View style={styles.sourceInfo}>
                      <Text style={styles.sourceName} numberOfLines={1}>{stat.name}</Text>
                      <View style={styles.sourceBarBg}>
                        <View
                          style={[
                            styles.sourceBarFill,
                            {
                              width: `${stat.avgCredibility}%` as any,
                              backgroundColor: getCredColor(stat.avgCredibility),
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.sourceMeta}>
                        {stat.totalPosts} posts{stat.confirmedCount > 0 ? ` · ${stat.confirmedCount} confirmed` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.credBadge,
                    {
                      borderColor: `${getCredColor(stat.avgCredibility)}44`,
                      backgroundColor: `${getCredColor(stat.avgCredibility)}18`,
                    },
                  ]}>
                    <Text style={[styles.credBadgeText, { color: getCredColor(stat.avgCredibility) }]}>
                      {stat.avgCredibility}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </GlassPanel>

        {/* Credibility legend */}
        <GlassPanel style={styles.panel}>
          <Text style={styles.legendTitle}>How credibility is scored</Text>
          <Text style={styles.legendBody}>
            Each post is scored based on source reputation, community engagement, and
            corroboration across multiple outlets.
          </Text>
          <View style={styles.legendRow}>
            {[
              { color: COLORS.green, label: '80%+ Reliable' },
              { color: COLORS.amber, label: '60%+ Likely'   },
              { color: '#f97316',    label: '40%+ Rumour'   },
              { color: COLORS.red,   label: '<40% Speculative' },
            ].map(l => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendText}>{l.label}</Text>
              </View>
            ))}
          </View>
        </GlassPanel>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  title: {
    fontSize: 26,
    fontWeight: FONT.black,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
    paddingVertical: 12,
    alignItems: 'center',
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
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: FONT.bold,
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
    marginLeft: 2,
  },
  panel: { marginBottom: 20 },
  panelInner: { padding: 16 },
  emptyPanel: { padding: 24, alignItems: 'center' },
  emptyText: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center' },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  catName: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: FONT.semibold,
    width: 90,
  },
  catBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: CAT_COLOR,
    opacity: 0.7,
  },
  catCount: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONT.bold,
    width: 28,
    textAlign: 'right',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  trackedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    gap: 6,
  },
  trackedTagText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: FONT.semibold,
  },
  trackedTagRemove: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: FONT.bold,
  },
  tagHint: { color: COLORS.textMuted, fontSize: 11 },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  sourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  sourceInfo: { flex: 1 },
  sourceRank: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: FONT.heavy,
    width: 28,
    textAlign: 'center',
  },
  sourceName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: FONT.semibold,
    marginBottom: 4,
  },
  sourceBarBg: {
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    marginBottom: 3,
  },
  sourceBarFill: { height: '100%' },
  sourceMeta: { color: COLORS.textMuted, fontSize: 10 },
  credBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    minWidth: 48,
    alignItems: 'center',
  },
  credBadgeText: { fontSize: 12, fontWeight: FONT.heavy },
  legendTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: FONT.bold,
    marginBottom: 6,
  },
  legendBody: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { color: COLORS.textMuted, fontSize: 10 },
});
