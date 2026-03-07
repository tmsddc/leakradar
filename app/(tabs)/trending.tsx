import React, { useMemo, useRef } from 'react';
import {
  Animated, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path, Polyline, Text as SvgText } from 'react-native-svg';
import { COLORS, FONT, RADIUS, SHADOW, TOKENS } from '../../constants/theme';
import { GradientBackground } from '../../components/GradientBackground';
import { TrendingGameCard } from '../../components/TrendingGameCard';
import { CredibilityRing } from '../../components/CredibilityRing';
import { useLeakStore } from '../../store/useLeakStore';
import { getTrendingGames, getSourceStats } from '../../lib/trending';

const PLATFORM_CATS = ['PlayStation', 'Xbox', 'Nintendo', 'PC'] as const;

const PLATFORM_COLORS: Record<string, string> = {
  PlayStation: COLORS.catPlayStation,
  Xbox:        COLORS.catXbox,
  Nintendo:    COLORS.catNintendo,
  PC:          COLORS.catPC,
};

// ── Donut Chart ────────────────────────────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 58;
  const innerR = 38;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const segments: { path: string; color: string; label: string; value: number }[] = [];
  let startAngle = -Math.PI / 2;

  for (const d of data) {
    if (d.value === 0) continue;
    const angle = (d.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const gap = 0.03; // gap between segments in radians

    const x1 = cx + outerR * Math.cos(startAngle + gap);
    const y1 = cy + outerR * Math.sin(startAngle + gap);
    const x2 = cx + outerR * Math.cos(endAngle - gap);
    const y2 = cy + outerR * Math.sin(endAngle - gap);
    const x3 = cx + innerR * Math.cos(endAngle - gap);
    const y3 = cy + innerR * Math.sin(endAngle - gap);
    const x4 = cx + innerR * Math.cos(startAngle + gap);
    const y4 = cy + innerR * Math.sin(startAngle + gap);
    const large = angle > Math.PI ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');

    segments.push({ path, color: d.color, label: d.label, value: d.value });
    startAngle = endAngle;
  }

  const topItem = data.reduce((a, b) => (b.value > a.value ? b : a), data[0]);

  return (
    <View style={donutStyles.row}>
      <Svg width={size} height={size}>
        <G>
          {segments.map((s, i) => (
            <Path key={i} d={s.path} fill={s.color} opacity={0.9} />
          ))}
        </G>
        {/* Center label */}
        <SvgText
          x={cx} y={cy - 5}
          textAnchor="middle"
          fontSize="18"
          fontWeight="800"
          fill={topItem.color}
        >
          {Math.round((topItem.value / total) * 100)}%
        </SvgText>
        <SvgText
          x={cx} y={cy + 12}
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fill={COLORS.textMuted}
          letterSpacing="0.5"
        >
          {topItem.label.toUpperCase()}
        </SvgText>
      </Svg>
      {/* Legend */}
      <View style={donutStyles.legend}>
        {data.filter(d => d.value > 0).map(d => (
          <View key={d.label} style={donutStyles.legendRow}>
            <View style={[donutStyles.legendDot, { backgroundColor: d.color }]} />
            <Text style={donutStyles.legendLabel}>{d.label}</Text>
            <Text style={[donutStyles.legendValue, { color: d.color }]}>
              {Math.round((d.value / total) * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const donutStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, color: COLORS.textSecondary, fontSize: 12, fontWeight: FONT.medium },
  legendValue: { fontSize: 12, fontWeight: FONT.bold },
});

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ values, color, width = 60, height = 24 }: {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height * 0.8) - height * 0.1;
    return `${x},${y}`;
  }).join(' ');

  return (
    <Svg width={width} height={height}>
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
    </Svg>
  );
}

// ── Source Rank Row ────────────────────────────────────────────────────────────
function SourceRankRow({
  stat, rank,
}: {
  stat: { name: string; avgCredibility: number; totalPosts: number; confirmedCount: number };
  rank: number;
}) {
  const color = TOKENS.credibility(stat.avgCredibility);
  return (
    <View style={sourceStyles.row}>
      <View style={[sourceStyles.rankBox, { borderColor: `${color}30` }]}>
        <Text style={[sourceStyles.rank, { color }]}>#{rank}</Text>
      </View>
      <View style={sourceStyles.info}>
        <Text style={sourceStyles.name} numberOfLines={1}>{stat.name}</Text>
        <View style={sourceStyles.metaRow}>
          <View style={[sourceStyles.bar, { backgroundColor: `${color}18` }]}>
            <View style={[sourceStyles.barFill, { width: `${stat.avgCredibility}%` as any, backgroundColor: color }]} />
          </View>
          <Text style={sourceStyles.meta}>
            {stat.totalPosts} posts{stat.confirmedCount > 0 ? ` · ${stat.confirmedCount} ✓` : ''}
          </Text>
        </View>
      </View>
      <CredibilityRing score={stat.avgCredibility} size={38} strokeWidth={3} />
    </View>
  );
}

const sourceStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    gap: 12,
  },
  rankBox: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  rank: { fontSize: 11, fontWeight: FONT.heavy },
  info: { flex: 1 },
  name: { color: COLORS.textPrimary, fontSize: 13, fontWeight: FONT.semibold, marginBottom: 5 },
  metaRow: { gap: 4 },
  bar: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  barFill: { height: '100%' },
  meta: { color: COLORS.textMuted, fontSize: 10 },
});

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  value, label, color, sublabel,
}: {
  value: string; label: string; color?: string; sublabel?: string;
}) {
  return (
    <View style={statStyles.card}>
      <Text style={[statStyles.value, { color: color ?? COLORS.textPrimary }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
      {sublabel ? <Text style={statStyles.sublabel}>{sublabel}</Text> : null}
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: FONT.heavy,
    letterSpacing: -0.5,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: FONT.heavy,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  sublabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    textAlign: 'center',
    opacity: 0.7,
  },
});

// ── Panel ─────────────────────────────────────────────────────────────────────
function Panel({ title, children, style }: { title: string; children: React.ReactNode; style?: any }) {
  return (
    <View style={[panelStyles.container, style]}>
      <Text style={panelStyles.title}>{title.toUpperCase()}</Text>
      <View style={panelStyles.body}>{children}</View>
    </View>
  );
}

const panelStyles = StyleSheet.create({
  container: { marginBottom: 16 },
  title: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: FONT.heavy,
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 2,
  },
  body: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
    ...SHADOW.card,
  },
});

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function TrendingScreen() {
  const insets = useSafeAreaInsets();
  const posts        = useLeakStore(s => s.posts);
  const trackedGames = useLeakStore(s => s.trackedGames);
  const toggleTrackGame = useLeakStore(s => s.toggleTrackGame);

  const trendingGames = useMemo(() => getTrendingGames(posts), [posts]);
  const sourceStats   = useMemo(() => getSourceStats(posts),   [posts]);

  const hotCount       = posts.filter(p => p.heat === 'hot').length;
  const confirmedCount = posts.filter(p => p.verificationStatus === 'confirmed').length;
  const avgCredibility = posts.length
    ? Math.round(posts.reduce((s, p) => s + p.credibility, 0) / posts.length)
    : 0;

  const donutData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of posts) counts[p.category] = (counts[p.category] ?? 0) + 1;
    return PLATFORM_CATS.map(cat => ({
      label: cat,
      value: counts[cat] ?? 0,
      color: PLATFORM_COLORS[cat] ?? COLORS.accent,
    })).filter(d => d.value > 0);
  }, [posts]);

  // Fake sparkline data for trending games (days 0-6)
  const sparkData = useMemo(() =>
    trendingGames.slice(0, 5).map(g => ({
      name: g.name,
      points: [1, 2, 1, 3, 2, 4, g.postCount].map((v, i) => v + i * 0.3),
      color: TOKENS.credibility(g.avgCredibility),
    })),
    [trendingGames],
  );

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 14, paddingBottom: 128 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>TRENDING</Text>
          <Text style={styles.pageSubtitle}>{posts.length} leaks indexed</Text>
        </View>

        {/* Summary stats — 4-card bento row */}
        <View style={styles.statsRow}>
          <StatCard
            value={String(hotCount)}
            label="Hot"
            color={COLORS.neonOrange}
          />
          <StatCard
            value={String(confirmedCount)}
            label="Confirmed"
            color={COLORS.neonGreen}
          />
          <StatCard
            value={`${avgCredibility}%`}
            label="Avg Cred"
            color={TOKENS.credibility(avgCredibility)}
          />
          <StatCard
            value={String(trackedGames.length)}
            label="Tracked"
            color={COLORS.accent}
          />
        </View>

        {/* Platform breakdown — Donut */}
        {posts.length > 0 && (
          <Panel title="Platform Breakdown">
            {donutData.length > 0
              ? <DonutChart data={donutData} />
              : <Text style={styles.empty}>No data yet</Text>
            }
          </Panel>
        )}

        {/* Trending games with sparklines */}
        <Panel title="Trending Games">
          {trendingGames.length === 0 ? (
            <Text style={styles.empty}>Scan the feed first to see trending games</Text>
          ) : (
            <View style={styles.gamesList}>
              {trendingGames.map((game, i) => {
                const spark = sparkData.find(s => s.name === game.name);
                return (
                  <View key={game.name} style={styles.gameRow}>
                    <TrendingGameCard game={game} rank={i + 1} />
                    {spark && (
                      <Sparkline values={spark.points} color={spark.color} />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </Panel>

        {/* Tracked games */}
        {trackedGames.length > 0 && (
          <Panel title="Your Tracked Games">
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
          </Panel>
        )}

        {/* Source reliability — ranked list with rings */}
        <Panel title="Source Reliability">
          {sourceStats.length === 0 ? (
            <Text style={styles.empty}>No source data yet</Text>
          ) : (
            <View>
              {sourceStats.map((stat, i) => (
                <SourceRankRow key={stat.name} stat={stat} rank={i + 1} />
              ))}
            </View>
          )}
        </Panel>

        {/* Credibility legend */}
        <Panel title="Credibility Scale">
          <View style={styles.legendRow}>
            {[
              { color: COLORS.neonGreen,  label: '80%+',  sub: 'Reliable'    },
              { color: COLORS.amber,       label: '60%+',  sub: 'Likely'      },
              { color: COLORS.neonOrange,  label: '40%+',  sub: 'Rumour'      },
              { color: COLORS.neonRed,     label: '<40%',  sub: 'Speculative' },
            ].map(l => (
              <View key={l.sub} style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: `${l.color}22`, borderColor: `${l.color}44` }]}>
                  <Text style={[styles.legendPct, { color: l.color }]}>{l.label}</Text>
                </View>
                <Text style={styles.legendSub}>{l.sub}</Text>
              </View>
            ))}
          </View>
        </Panel>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 14 },
  pageHeader: { marginBottom: 16 },
  pageTitle: {
    fontSize: 28,
    fontWeight: FONT.black,
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  pageSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  empty: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  gamesList: { gap: 0 },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  trackedTagText: { color: COLORS.accent, fontSize: 12, fontWeight: FONT.semibold },
  trackedTagRemove: { color: COLORS.textMuted, fontSize: 14, fontWeight: FONT.bold },
  tagHint: { color: COLORS.textMuted, fontSize: 11 },
  legendRow: {
    flexDirection: 'row',
    gap: 8,
  },
  legendItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: '100%',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  legendPct: {
    fontSize: 11,
    fontWeight: FONT.heavy,
    letterSpacing: 0.3,
  },
  legendSub: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: FONT.medium,
    textAlign: 'center',
  },
});
