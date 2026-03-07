import React, { useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT, RADIUS, SHADOW } from '../../constants/theme';
import { useLeakStore } from '../../store/useLeakStore';
import { LeakCard } from '../../components/LeakCard';
import { GradientBackground } from '../../components/GradientBackground';
import type { LeakPost } from '../../lib/api';

// ─── Analytics helpers (no AI, pure stats) ───────────────────────────────────

const TOPIC_SKIP = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from',
  'as','is','was','are','were','be','been','being','have','has','had','do','does','did',
  'will','would','could','should','may','might','that','this','these','those','it','its',
  'they','their','them','we','our','you','your','he','she','his','her',
  'new','game','games','gaming','report','reportedly','allegedly','according','sources',
  'insider','leak','leaked','leaks','rumour','rumor','news','says','said','claim','claims',
  'update','latest','first','after','from','into','over','then','than','some','also','now',
]);

function extractKeyTopics(posts: LeakPost[]): string[] {
  const freq: Record<string, number> = {};
  for (const p of posts) {
    const words = p.title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !TOPIC_SKIP.has(w));
    const seen = new Set<string>();
    for (const w of words) {
      if (!seen.has(w)) { freq[w] = (freq[w] ?? 0) + 1; seen.add(w); }
    }
  }
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
}

function buildWeeklyActivity(posts: LeakPost[]): number[] {
  const weeks = Array(8).fill(0);
  const now = Date.now() / 1000;
  for (const p of posts) {
    const w = Math.floor((now - p.timestamp) / (7 * 24 * 3600));
    if (w >= 0 && w < 8) weeks[7 - w]++;
  }
  return weeks;
}

function buildSourceBreakdown(posts: LeakPost[]): { source: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const p of posts) {
    for (const src of p.sources) counts[src] = (counts[src] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function credColor(n: number) {
  return n >= 75 ? COLORS.green : n >= 50 ? COLORS.amber : COLORS.red;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function GameDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const posts = useLeakStore(s => s.posts);

  const gamePosts = useMemo(() => {
    const q = (name ?? '').toLowerCase();
    return [...posts]
      .filter(p =>
        p.tags.some(t => t.toLowerCase() === q) ||
        p.title.toLowerCase().includes(q)
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [posts, name]);

  const topClaims   = useMemo(() => [...gamePosts].sort((a, b) => b.credibility - a.credibility).slice(0, 4), [gamePosts]);
  const keyTopics   = useMemo(() => extractKeyTopics(gamePosts), [gamePosts]);
  const weeklyData  = useMemo(() => buildWeeklyActivity(gamePosts), [gamePosts]);
  const sourceBkdn  = useMemo(() => buildSourceBreakdown(gamePosts), [gamePosts]);

  const avgCred     = gamePosts.length ? Math.round(gamePosts.reduce((s, p) => s + p.credibility, 0) / gamePosts.length) : 0;
  const uniqueSrcs  = new Set(gamePosts.flatMap(p => p.sources)).size;
  const confirmed   = gamePosts.filter(p => p.verificationStatus === 'confirmed').length;

  const now = Date.now() / 1000;
  const last7  = gamePosts.filter(p => now - p.timestamp < 7 * 24 * 3600).length;
  const prev7  = gamePosts.filter(p => now - p.timestamp >= 7*24*3600 && now - p.timestamp < 14*24*3600).length;
  const trend  = last7 > prev7 ? 'rising' : last7 < prev7 ? 'falling' : 'stable';
  const trendColor = trend === 'rising' ? COLORS.green : trend === 'falling' ? COLORS.red : COLORS.textMuted;

  const maxWeek  = Math.max(...weeklyData, 1);
  const maxSrc   = Math.max(...sourceBkdn.map(s => s.count), 1);

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
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={() => (
          <View style={styles.body}>

            {/* ── Quick stats ─────────────────────────────── */}
            <View style={styles.statRow}>
              <StatBox icon="document-text-outline" label="Leaks"    value={String(gamePosts.length)} />
              <StatBox icon="shield-checkmark-outline" label="Avg Cred" value={`${avgCred}%`} valueColor={credColor(avgCred)} iconColor={credColor(avgCred)} />
              <StatBox icon="globe-outline"           label="Sources"  value={String(uniqueSrcs)} />
              <StatBox icon={trend === 'rising' ? 'trending-up' : trend === 'falling' ? 'trending-down' : 'remove'} label="Trend" value={trend === 'rising' ? '↑ Up' : trend === 'falling' ? '↓ Down' : '— Flat'} valueColor={trendColor} iconColor={trendColor} />
            </View>

            {gamePosts.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={44} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No leaks found</Text>
                <Text style={styles.emptySubtext}>No information about "{name}" in the current feed. Try refreshing.</Text>
              </View>
            ) : <>

              {/* ── Top Claims ──────────────────────────────── */}
              <Text style={styles.sectionLabel}>Top Claims</Text>
              <View style={styles.card}>
                {topClaims.map((p, i) => (
                  <View key={p.id} style={[styles.claimRow, i < topClaims.length - 1 && styles.claimBorder]}>
                    <View style={[styles.claimDot, { backgroundColor: credColor(p.credibility) }]} />
                    <View style={styles.claimBody}>
                      <Text style={styles.claimTitle} numberOfLines={2}>{p.title}</Text>
                      <View style={styles.claimMeta}>
                        <Text style={styles.claimSource}>{p.sources[0]}</Text>
                        <View style={[styles.claimCredBadge, { borderColor: `${credColor(p.credibility)}40`, backgroundColor: `${credColor(p.credibility)}14` }]}>
                          <Text style={[styles.claimCredText, { color: credColor(p.credibility) }]}>{p.credibility}%</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* ── Activity chart ──────────────────────────── */}
              <Text style={styles.sectionLabel}>Weekly Activity</Text>
              <View style={styles.card}>
                <View style={styles.chartWrap}>
                  {weeklyData.map((count, i) => (
                    <View key={i} style={styles.chartBarCol}>
                      <View style={styles.chartBarBg}>
                        {count > 0 ? (
                          <LinearGradient
                            colors={[COLORS.accent, `${COLORS.accent}60`]}
                            style={[styles.chartBarFill, { height: `${Math.round((count / maxWeek) * 100)}%` as any }]}
                          />
                        ) : null}
                      </View>
                      {count > 0 ? (
                        <Text style={styles.chartBarCount}>{count}</Text>
                      ) : (
                        <Text style={styles.chartBarCount}> </Text>
                      )}
                    </View>
                  ))}
                </View>
                <View style={styles.chartLabels}>
                  <Text style={styles.chartLabelLeft}>8 weeks ago</Text>
                  <Text style={styles.chartLabelRight}>This week</Text>
                </View>
              </View>

              {/* ── Source coverage ─────────────────────────── */}
              {sourceBkdn.length > 0 ? <>
                <Text style={styles.sectionLabel}>Source Coverage</Text>
                <View style={styles.card}>
                  {sourceBkdn.map((s, i) => (
                    <View key={s.source} style={[styles.srcRow, i < sourceBkdn.length - 1 && styles.srcBorder]}>
                      <Text style={styles.srcName} numberOfLines={1}>{s.source}</Text>
                      <View style={styles.srcBarWrap}>
                        <View style={[styles.srcBarFill, { width: `${Math.round((s.count / maxSrc) * 100)}%` as any }]} />
                      </View>
                      <Text style={styles.srcCount}>{s.count}</Text>
                    </View>
                  ))}
                </View>
              </> : null}

              {/* ── Key Topics ──────────────────────────────── */}
              {keyTopics.length > 0 ? <>
                <Text style={styles.sectionLabel}>Frequent Topics</Text>
                <View style={styles.topicsRow}>
                  {keyTopics.map(t => (
                    <View key={t} style={styles.topicChip}>
                      <Text style={styles.topicText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </> : null}

              {/* ── Timeline header ─────────────────────────── */}
              <Text style={[styles.sectionLabel, { marginTop: 4 }]}>
                Full Timeline · {gamePosts.length} leak{gamePosts.length !== 1 ? 's' : ''}
              </Text>
            </>}
          </View>
        )}
        renderItem={({ item }) => <LeakCard post={item} />}
      />
    </GradientBackground>
  );
}

function StatBox({ icon, label, value, valueColor, iconColor }: {
  icon: any; label: string; value: string; valueColor?: string; iconColor?: string;
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
    width: 38, height: 38,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18, fontWeight: FONT.bold, letterSpacing: -0.4,
    flex: 1, textAlign: 'center',
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 8,
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
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 12,
    alignItems: 'center', gap: 4,
    ...SHADOW.card,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 14, fontWeight: FONT.bold, letterSpacing: -0.3,
    textAlign: 'center',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 9, fontWeight: FONT.medium,
    textAlign: 'center', letterSpacing: 0.2,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 10, fontWeight: FONT.heavy,
    letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    marginBottom: 20,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  // Claims
  claimRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
  },
  claimBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  claimDot: {
    width: 8, height: 8, borderRadius: 4,
    marginTop: 6, flexShrink: 0,
  },
  claimBody: { flex: 1, gap: 6 },
  claimTitle: {
    color: COLORS.textPrimary,
    fontSize: 13, fontWeight: FONT.semibold,
    lineHeight: 19,
  },
  claimMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  claimSource: {
    color: COLORS.textMuted,
    fontSize: 10, fontWeight: FONT.medium,
  },
  claimCredBadge: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: RADIUS.sm, borderWidth: 1,
  },
  claimCredText: { fontSize: 10, fontWeight: FONT.bold },
  // Chart
  chartWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 4,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBarBg: {
    width: '100%',
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: RADIUS.sm,
  },
  chartBarCount: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: FONT.bold,
    textAlign: 'center',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
  },
  chartLabelLeft: { color: COLORS.textMuted, fontSize: 9 },
  chartLabelRight: { color: COLORS.textMuted, fontSize: 9 },
  // Sources
  srcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  srcBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  srcName: {
    color: COLORS.textSecondary,
    fontSize: 12, fontWeight: FONT.medium,
    width: 110, flexShrink: 0,
  },
  srcBarWrap: {
    flex: 1, height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2, overflow: 'hidden',
  },
  srcBarFill: {
    height: 4, borderRadius: 2,
    backgroundColor: COLORS.accent,
    opacity: 0.7,
  },
  srcCount: {
    color: COLORS.textMuted,
    fontSize: 11, fontWeight: FONT.bold,
    width: 20, textAlign: 'right',
  },
  // Topics
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  topicChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  topicText: {
    color: COLORS.textSecondary,
    fontSize: 12, fontWeight: FONT.medium,
  },
  // Empty
  empty: {
    alignItems: 'center',
    paddingTop: 40, paddingHorizontal: 32, gap: 10,
    marginBottom: 20,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18, fontWeight: FONT.bold, marginTop: 4,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 13, textAlign: 'center', lineHeight: 19,
  },
});
