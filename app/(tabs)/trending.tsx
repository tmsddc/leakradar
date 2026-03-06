import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, RADIUS, SHADOW } from '../../constants/theme';
import { GradientBackground } from '../../components/GradientBackground';
import { GlassPanel } from '../../components/GlassPanel';
import { TrendingGameCard } from '../../components/TrendingGameCard';
import { useLeakStore } from '../../store/useLeakStore';
import { getTrendingGames, getSourceStats } from '../../lib/trending';

const PLATFORM_CATS = ['PlayStation', 'Xbox', 'Nintendo', 'PC', 'Multi'];
const CAT_COLORS: Record<string, string> = {
  PlayStation: '#2563eb',
  Xbox: '#16a34a',
  Nintendo: '#dc2626',
  PC: '#9333ea',
  Multi: '#06b6d4',
};

function getCredColor(score: number): string {
  if (score >= 80) return '#34d399';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

export default function TrendingScreen() {
  const insets = useSafeAreaInsets();
  const posts = useLeakStore(s => s.posts);
  const trackedGames = useLeakStore(s => s.trackedGames);
  const toggleTrackGame = useLeakStore(s => s.toggleTrackGame);

  const trendingGames = useMemo(() => getTrendingGames(posts), [posts]);
  const sourceStats = useMemo(() => getSourceStats(posts), [posts]);

  const hotCount = posts.filter(p => p.heat === 'hot').length;
  const confirmedCount = posts.filter(p => p.verificationStatus === 'confirmed').length;
  const avgCredibility = posts.length
    ? Math.round(posts.reduce((s, p) => s + p.credibility, 0) / posts.length)
    : 0;

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of posts) {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    }
    return PLATFORM_CATS.map(cat => ({ cat, count: counts[cat] ?? 0 })).sort((a, b) => b.count - a.count);
  }, [posts]);

  const maxCatCount = Math.max(...categoryBreakdown.map(c => c.count), 1);

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
          <View style={[styles.statCard, { borderColor: 'rgba(52,211,153,0.25)', backgroundColor: 'rgba(52,211,153,0.08)' }]}>
            <Text style={styles.statValue}>{hotCount}</Text>
            <Text style={styles.statLabel}>🔥 Hot</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(6,182,212,0.25)', backgroundColor: 'rgba(6,182,212,0.08)' }]}>
            <Text style={styles.statValue}>{confirmedCount}</Text>
            <Text style={styles.statLabel}>✓ Confirmed</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(245,158,11,0.25)', backgroundColor: 'rgba(245,158,11,0.08)' }]}>
            <Text style={[styles.statValue, { color: getCredColor(avgCredibility) }]}>{avgCredibility}%</Text>
            <Text style={styles.statLabel}>Avg Cred.</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(139,92,246,0.25)', backgroundColor: 'rgba(139,92,246,0.08)' }]}>
            <Text style={styles.statValue}>{trackedGames.length}</Text>
            <Text style={styles.statLabel}>★ Tracked</Text>
          </View>
        </View>

        {/* Platform Breakdown */}
        {posts.length > 0 && (
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
                        {
                          width: `${Math.round((count / maxCatCount) * 100)}%`,
                          backgroundColor: CAT_COLORS[cat] ?? COLORS.accentCyan,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.catCount}>{count}</Text>
                </View>
              ))}
            </GlassPanel>
          </>
        )}

        {/* Trending games */}
        <Text style={styles.sectionTitle}>TRENDING GAMES</Text>
        <GlassPanel style={styles.panel} noPadding>
          {trendingGames.length === 0 ? (
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyIcon}>🎮</Text>
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
                  <TouchableOpacity
                    key={game}
                    style={styles.trackedTag}
                    onPress={() => toggleTrackGame(game)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.trackedTagText}>★ {game}</Text>
                    <Text style={styles.trackedTagRemove}> ×</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.tagHint}>Tap to untrack a game</Text>
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
                    <View style={styles.sourceInfo}>
                      <Text style={styles.sourceName} numberOfLines={1}>{stat.name}</Text>
                      <View style={styles.sourceBarBg}>
                        <View
                          style={[
                            styles.sourceBarFill,
                            { width: `${stat.avgCredibility}%`, backgroundColor: getCredColor(stat.avgCredibility) },
                          ]}
                        />
                      </View>
                      <Text style={styles.sourceMetaText}>
                        {stat.totalPosts} posts{stat.confirmedCount > 0 ? ` · ${stat.confirmedCount} confirmed` : ''}
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

        {/* How credibility works */}
        <GlassPanel style={[styles.panel, styles.tipPanel]}>
          <Text style={styles.tipTitle}>💡 How Credibility Works</Text>
          <Text style={styles.tipText}>
            Each leak is scored based on source reputation, community engagement (upvotes + comments), and corroboration across multiple outlets.
          </Text>
          <View style={styles.legendRow}>
            {[
              { color: '#34d399', label: '80%+ Reliable' },
              { color: '#f59e0b', label: '60%+ Likely' },
              { color: '#f97316', label: '40%+ Rumour' },
              { color: '#ef4444', label: '<40% Speculative' },
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
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
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
    textAlign: 'center',
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
  emptyPanel: { padding: 24, alignItems: 'center' },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
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
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    borderRadius: 3,
    opacity: 0.8,
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
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.25)',
  },
  trackedTagText: {
    color: COLORS.accentGreen,
    fontSize: 12,
    fontWeight: FONT.semibold,
  },
  trackedTagRemove: {
    color: 'rgba(52,211,153,0.6)',
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
    borderBottomColor: 'rgba(255,255,255,0.05)',
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
    fontSize: 13,
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
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    marginBottom: 3,
  },
  sourceBarFill: { height: '100%', borderRadius: 2 },
  sourceMetaText: { color: COLORS.textMuted, fontSize: 10 },
  credBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    minWidth: 48,
    alignItems: 'center',
  },
  credBadgeText: { fontSize: 12, fontWeight: FONT.heavy },
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
    marginBottom: 14,
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
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.textMuted, fontSize: 10, fontWeight: FONT.medium },
});
