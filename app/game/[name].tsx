import React, { useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW, TOKENS } from '../../constants/theme';
import { useLeakStore } from '../../store/useLeakStore';
import { LeakCard } from '../../components/LeakCard';
import { CredibilityRing } from '../../components/CredibilityRing';
import { GradientBackground } from '../../components/GradientBackground';
import type { LeakPost } from '../../lib/api';

// ─── Analytics helpers ──────────────────────────────────────────────────────

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

function buildSourceBreakdown(posts: LeakPost[]): { source: string; count: number; avgCred: number }[] {
  const counts: Record<string, { count: number; totalCred: number }> = {};
  for (const p of posts) {
    for (const src of p.sources) {
      if (!counts[src]) counts[src] = { count: 0, totalCred: 0 };
      counts[src].count++;
      counts[src].totalCred += p.credibility;
    }
  }
  return Object.entries(counts)
    .map(([source, { count, totalCred }]) => ({ source, count, avgCred: Math.round(totalCred / count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function GameDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const posts = useLeakStore(s => s.posts);
  const trackedGames = useLeakStore(s => s.trackedGames);
  const toggleTrackGame = useLeakStore(s => s.toggleTrackGame);

  const isTracked = trackedGames.includes(name ?? '');

  const gamePosts = useMemo(() => {
    const q = (name ?? '').toLowerCase();
    return [...posts]
      .filter(p =>
        p.tags.some(t => t.toLowerCase() === q) ||
        p.title.toLowerCase().includes(q)
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [posts, name]);

  const topClaims  = useMemo(() => [...gamePosts].sort((a, b) => b.credibility - a.credibility).slice(0, 4), [gamePosts]);
  const keyTopics  = useMemo(() => extractKeyTopics(gamePosts), [gamePosts]);
  const sourceBkdn = useMemo(() => buildSourceBreakdown(gamePosts), [gamePosts]);

  const avgCred     = gamePosts.length ? Math.round(gamePosts.reduce((s, p) => s + p.credibility, 0) / gamePosts.length) : 0;
  const uniqueSrcs  = new Set(gamePosts.flatMap(p => p.sources)).size;
  const confirmed   = gamePosts.filter(p => p.verificationStatus === 'confirmed').length;

  const now = Date.now() / 1000;
  const last7  = gamePosts.filter(p => now - p.timestamp < 7 * 24 * 3600).length;
  const prev7  = gamePosts.filter(p => now - p.timestamp >= 7*24*3600 && now - p.timestamp < 14*24*3600).length;
  const trend  = last7 > prev7 ? 'rising' : last7 < prev7 ? 'falling' : 'stable';
  const trendColor = trend === 'rising' ? COLORS.neonGreen : trend === 'falling' ? COLORS.neonRed : COLORS.textMuted;

  const maxSrc = Math.max(...sourceBkdn.map(s => s.count), 1);

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
        <TouchableOpacity
          onPress={() => toggleTrackGame(name ?? '')}
          style={[styles.trackBtn, isTracked && styles.trackBtnActive]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name={isTracked ? 'bookmark' : 'bookmark-outline'} size={16} color={isTracked ? COLORS.accent : COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={gamePosts}
        keyExtractor={p => p.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={() => (
          <View style={styles.body}>

            {/* ── Credibility hero ─────────────────────────── */}
            <View style={styles.credHero}>
              <CredibilityRing score={avgCred} size={72} strokeWidth={5} />
              <View style={styles.credHeroInfo}>
                <Text style={styles.credHeroLabel}>Average Credibility</Text>
                <Text style={[styles.credHeroValue, { color: TOKENS.credibility(avgCred) }]}>{avgCred}%</Text>
                <Text style={styles.credHeroSub}>across {gamePosts.length} leak{gamePosts.length !== 1 ? 's' : ''}</Text>
              </View>
            </View>

            {/* ── Quick stats ─────────────────────────────── */}
            <View style={styles.statRow}>
              <StatBox icon="document-text-outline" label="Leaks" value={String(gamePosts.length)} color={COLORS.neonBlue} />
              <StatBox icon="checkmark-circle-outline" label="Confirmed" value={String(confirmed)} color={COLORS.neonGreen} />
              <StatBox icon="globe-outline" label="Sources" value={String(uniqueSrcs)} color={COLORS.neonPurple} />
              <StatBox
                icon={trend === 'rising' ? 'trending-up' : trend === 'falling' ? 'trending-down' : 'remove'}
                label="7-day"
                value={trend === 'rising' ? `+${last7}` : trend === 'falling' ? `${last7}` : `${last7}`}
                color={trendColor}
              />
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
                {topClaims.map((p, i) => {
                  const claimColor = TOKENS.credibility(p.credibility);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.claimRow, i < topClaims.length - 1 && styles.claimBorder]}
                      onPress={() => router.push({ pathname: '/leak/[id]', params: { id: p.id } })}
                      activeOpacity={0.8}
                    >
                      <CredibilityRing score={p.credibility} size={28} strokeWidth={2.5} compact={false} />
                      <View style={styles.claimBody}>
                        <Text style={styles.claimTitle} numberOfLines={2}>{p.title}</Text>
                        <View style={styles.claimMeta}>
                          <Text style={styles.claimSource}>{p.sources[0]}</Text>
                          <View style={[styles.claimCredBadge, { borderColor: `${claimColor}40`, backgroundColor: `${claimColor}14` }]}>
                            <Text style={[styles.claimCredText, { color: claimColor }]}>{p.credibility}%</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Source coverage ─────────────────────────── */}
              {sourceBkdn.length > 0 && <>
                <Text style={styles.sectionLabel}>Source Coverage</Text>
                <View style={styles.card}>
                  {sourceBkdn.map((s, i) => {
                    const srcColor = TOKENS.credibility(s.avgCred);
                    return (
                      <View key={s.source} style={[styles.srcRow, i < sourceBkdn.length - 1 && styles.srcBorder]}>
                        <Text style={styles.srcName} numberOfLines={1}>{s.source}</Text>
                        <View style={styles.srcBarWrap}>
                          <View style={[styles.srcBarFill, { width: `${Math.round((s.count / maxSrc) * 100)}%` as any, backgroundColor: srcColor }]} />
                        </View>
                        <CredibilityRing score={s.avgCred} size={22} strokeWidth={2} compact={false} />
                        <Text style={styles.srcCount}>{s.count}</Text>
                      </View>
                    );
                  })}
                </View>
              </>}

              {/* ── Key Topics ──────────────────────────────── */}
              {keyTopics.length > 0 && <>
                <Text style={styles.sectionLabel}>Frequent Topics</Text>
                <View style={styles.topicsRow}>
                  {keyTopics.map((t, i) => (
                    <View key={t} style={[styles.topicChip, i < 3 && styles.topicChipHot]}>
                      {i < 3 && <View style={[styles.topicDot, { backgroundColor: i === 0 ? COLORS.neonOrange : i === 1 ? COLORS.neonPurple : COLORS.neonBlue }]} />}
                      <Text style={[styles.topicText, i < 3 && { color: COLORS.textPrimary }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              </>}

              {/* ── Timeline header ─────────────────────────── */}
              <View style={styles.timelineHeader}>
                <Text style={styles.sectionLabel}>Full Timeline</Text>
                <View style={styles.timelineCount}>
                  <Text style={styles.timelineCountText}>{gamePosts.length}</Text>
                </View>
              </View>
            </>}
          </View>
        )}
        renderItem={({ item }) => <LeakCard post={item} />}
      />
    </GradientBackground>
  );
}

function StatBox({ icon, label, value, color }: {
  icon: any; label: string; value: string; color: string;
}) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={17} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
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
  trackBtn: {
    width: 38, height: 38,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  trackBtnActive: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accentBorder,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  // Credibility hero
  credHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
    marginBottom: 12,
    ...SHADOW.card,
  },
  credHeroInfo: { flex: 1, gap: 2 },
  credHeroLabel: {
    color: COLORS.textMuted,
    fontSize: 10, fontWeight: FONT.heavy,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  credHeroValue: {
    fontSize: 28, fontWeight: FONT.black, letterSpacing: -1,
  },
  credHeroSub: {
    color: COLORS.textMuted,
    fontSize: 11, fontWeight: FONT.medium,
  },
  // Stats
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
    fontSize: 16, fontWeight: FONT.black, letterSpacing: -0.3,
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
    width: 90, flexShrink: 0,
  },
  srcBarWrap: {
    flex: 1, height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2, overflow: 'hidden',
  },
  srcBarFill: {
    height: 4, borderRadius: 2,
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
  topicChipHot: {
    borderColor: COLORS.accentBorder,
    backgroundColor: COLORS.accentDim,
  },
  topicDot: {
    width: 5, height: 5, borderRadius: 3,
    position: 'absolute', top: 6, left: 6,
  },
  topicText: {
    color: COLORS.textSecondary,
    fontSize: 12, fontWeight: FONT.medium,
  },
  // Timeline
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  timelineCount: {
    backgroundColor: COLORS.accentDim,
    paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: RADIUS.xs,
  },
  timelineCountText: {
    color: COLORS.accent,
    fontSize: 10, fontWeight: FONT.bold,
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
