import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, SectionList, StyleSheet, Text,
  TouchableOpacity, View, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, TOKENS } from '../../constants/theme';
import { GradientBackground } from '../../components/GradientBackground';
import { SearchBar } from '../../components/SearchBar';
import { CategoryPills } from '../../components/CategoryPills';
import { LeakCard } from '../../components/LeakCard';
import { ScanOverlay } from '../../components/ScanOverlay';
import { FilterSheet } from '../../components/FilterSheet';
import { useLeakStore } from '../../store/useLeakStore';
import { fetchLeaks } from '../../lib/api';
import { deduplicatePosts } from '../../lib/dedup';
import type { LeakPost } from '../../lib/api';

type FeedSection = { title: string; data: LeakPost[] };

function groupPostsByDate(posts: LeakPost[]): FeedSection[] {
  const now = Date.now() / 1000;
  const buckets: Record<string, LeakPost[]> = {
    'Today': [], 'Yesterday': [], 'This Week': [], 'Older': [],
  };
  for (const p of posts) {
    const age = now - p.timestamp;
    if      (age < 86400)  buckets['Today'].push(p);
    else if (age < 172800) buckets['Yesterday'].push(p);
    else if (age < 604800) buckets['This Week'].push(p);
    else                   buckets['Older'].push(p);
  }
  return Object.entries(buckets)
    .filter(([, data]) => data.length > 0)
    .map(([title, data]) => ({ title, data }));
}

const SORT_OPTIONS = [
  { label: 'Hot',  value: 'hot' as const,  icon: 'flame-outline'      as const },
  { label: 'New',  value: 'new' as const,  icon: 'time-outline'       as const },
  { label: 'Top',  value: 'top' as const,  icon: 'trending-up-outline' as const },
] as const;

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const {
    filteredPosts, isScanning, duplicatesRemoved, lastScanTime,
    setPosts, setIsScanning, addScanLog, clearScanLogs, loadSavedPosts,
    loadCachedFeed, loadTrackedGames, markAllRead, settings, loadSettings,
    sortOption, setSortOption,
    minCredibility, postTypeFilter,
  } = useLeakStore();

  const activeFilterCount = (minCredibility > 0 ? 1 : 0) + (postTypeFilter !== 'all' ? 1 : 0);

  const scan = useCallback(async () => {
    setIsScanning(true);
    clearScanLogs();
    try {
      const { settings: s } = useLeakStore.getState();
      const rawPosts = await fetchLeaks(
        (log) => addScanLog(log),
        s.enabledSubreddits,
        s.enabledRSSFeeds,
      );
      const deduped = deduplicatePosts(rawPosts);
      await setPosts(deduped, rawPosts.length - deduped.length);
    } catch {}
    setIsScanning(false);
  }, [setPosts, setIsScanning, addScanLog, clearScanLogs]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const interval = settings?.refreshInterval ?? 0;
    if (interval > 0) {
      refreshTimerRef.current = setTimeout(() => { scan(); scheduleRefresh(); }, interval);
    }
  }, [settings?.refreshInterval, scan]);

  useEffect(() => {
    loadSettings();
    loadSavedPosts();
    loadTrackedGames();
    loadCachedFeed().then(() => scan());
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, []);

  useEffect(() => {
    scheduleRefresh();
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, [scheduleRefresh]);

  useEffect(() => {
    if (!isScanning && filteredPosts.length > 0) markAllRead();
  }, [isScanning, filteredPosts.length]);

  const sections = React.useMemo(() => groupPostsByDate(filteredPosts), [filteredPosts]);

  // ── Header shrink animation ────────────────────────────────────────────────
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0.85],
    extrapolate: 'clamp',
  });
  const logoSize = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [26, 20],
    extrapolate: 'clamp',
  });

  const renderItem = useCallback(({ item, index }: { item: LeakPost; index: number }) => (
    <LeakCard post={item} hero={index === 0 && item.thumbnail != null} />
  ), []);

  const renderSectionHeader = useCallback(({ section }: { section: FeedSection }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLine} />
      <Text style={styles.sectionHeaderText}>{section.title.toUpperCase()}</Text>
      <View style={[styles.sectionCount, { backgroundColor: COLORS.accentDim }]}>
        <Text style={styles.sectionCountText}>{section.data.length}</Text>
      </View>
      <View style={styles.sectionLine} />
    </View>
  ), []);

  const keyExtractor = useCallback((item: LeakPost) => item.id, []);

  const timeStr = lastScanTime
    ? new Date(lastScanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <GradientBackground>
      {/* ── Sticky Header ──────────────────────────────────────────────────── */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 10, transform: [{ scaleY: headerHeight }] }]}>
        <View style={styles.headerRow}>
          <Animated.Text style={[styles.logo, { fontSize: logoSize }]}>
            LEAK<Text style={[styles.logoAccent]}>RADAR</Text>
          </Animated.Text>
          <View style={styles.headerRight}>
            {timeStr && !isScanning ? (
              <Text style={styles.headerTime}>{timeStr}</Text>
            ) : null}
            <TouchableOpacity
              onPress={scan}
              style={[styles.refreshBtn, isScanning && styles.refreshBtnActive]}
              disabled={isScanning}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isScanning ? 'radio-outline' : 'refresh-outline'}
                size={17}
                color={isScanning ? COLORS.accent : COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <SearchBar />

        {/* Category pills */}
        <CategoryPills />

        {/* Sort + Filter — single compact row */}
        <View style={styles.controlsRow}>
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map(opt => {
              const active = sortOption === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.sortBtn, active && styles.sortBtnActive]}
                  onPress={() => setSortOption(opt.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={opt.icon} size={12} color={active ? COLORS.accent : COLORS.textMuted} />
                  <Text style={[styles.sortText, active && styles.sortTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
            onPress={() => setFilterOpen(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="options-outline"
              size={13}
              color={activeFilterCount > 0 ? COLORS.accent : COLORS.textSecondary}
            />
            <Text style={[styles.filterText, activeFilterCount > 0 && styles.filterTextActive]}>
              Filter
            </Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats line */}
        {filteredPosts.length > 0 && !isScanning ? (
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              {filteredPosts.length} leaks
              {duplicatesRemoved > 0 ? ` · ${duplicatesRemoved} merged` : ''}
            </Text>
          </View>
        ) : null}
      </Animated.View>

      {/* ── Feed ────────────────────────────────────────────────────────────── */}
      <Animated.SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={keyExtractor}
        contentContainerStyle={[styles.list, { paddingBottom: 128 }]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={scan} tintColor={COLORS.accent} />
        }
        ListEmptyComponent={
          !isScanning ? (
            <View style={styles.empty}>
              <Ionicons name="radio-outline" size={44} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No leaks detected</Text>
              <Text style={styles.emptySubtext}>Pull to scan or adjust filters</Text>
              <TouchableOpacity style={styles.scanBtn} onPress={scan}>
                <Text style={styles.scanBtnText}>Scan Now</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      <ScanOverlay />
      <FilterSheet visible={filterOpen} onClose={() => setFilterOpen(false)} />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.background,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    transformOrigin: 'top',
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontWeight: FONT.black,
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  logoAccent: {
    color: COLORS.accent,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTime: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONT.medium,
    letterSpacing: 0.5,
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtnActive: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accentBorder,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 2,
    gap: 4,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 2,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 2,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.xs,
  },
  sortBtnActive: {
    backgroundColor: COLORS.accentDim,
  },
  sortText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: FONT.semibold,
  },
  sortTextActive: {
    color: COLORS.accent,
    fontWeight: FONT.bold,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.surface,
  },
  filterBtnActive: {
    borderColor: COLORS.accentBorder,
    backgroundColor: COLORS.accentDim,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: FONT.semibold,
  },
  filterTextActive: {
    color: COLORS.accent,
    fontWeight: FONT.bold,
  },
  filterBadge: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: FONT.black,
  },
  statsRow: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    paddingTop: 2,
  },
  statsText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: FONT.medium,
    letterSpacing: 0.3,
  },
  list: { paddingTop: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
    gap: 10,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.cardBorder,
  },
  sectionHeaderText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: FONT.heavy,
    letterSpacing: 1.5,
  },
  sectionCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  sectionCountText: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: FONT.bold,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: FONT.bold,
    marginTop: 8,
    letterSpacing: -0.3,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  scanBtn: {
    marginTop: 16,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accent,
  },
  scanBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: FONT.bold,
    letterSpacing: 0.5,
  },
});
