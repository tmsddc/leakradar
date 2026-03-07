import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS } from '../../constants/theme';
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

const SORT_OPTIONS = [
  { label: 'Hot',  value: 'hot' as const, icon: 'flame-outline'      as const },
  { label: 'New',  value: 'new' as const, icon: 'time-outline'       as const },
  { label: 'Top',  value: 'top' as const, icon: 'trending-up-outline' as const },
] as const;

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

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
      refreshTimerRef.current = setTimeout(() => {
        scan();
        scheduleRefresh();
      }, interval);
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

  const renderItem = useCallback(({ item }: { item: LeakPost }) => (
    <LeakCard post={item} />
  ), []);

  const keyExtractor = useCallback((item: LeakPost) => item.id, []);

  const timeStr = lastScanTime
    ? new Date(lastScanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <GradientBackground>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.logo}>LeakRadar</Text>
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
              size={19}
              color={isScanning ? COLORS.accent : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <SearchBar />

      {/* Category pills */}
      <CategoryPills />

      {/* Sort row + Filter button — single compact row */}
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
                <Ionicons
                  name={opt.icon}
                  size={13}
                  color={active ? COLORS.accent : COLORS.textMuted}
                />
                <Text style={[styles.sortText, active && styles.sortTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setFilterOpen(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="options-outline"
            size={15}
            color={activeFilterCount > 0 ? COLORS.accent : COLORS.textSecondary}
          />
          <Text style={[styles.filterText, activeFilterCount > 0 && styles.filterTextActive]}>
            Filter
          </Text>
          {activeFilterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* Subtle stats line */}
      {filteredPosts.length > 0 && !isScanning ? (
        <View style={styles.statsRow}>
          <View style={styles.statsDivider} />
          <Text style={styles.statsText}>
            {filteredPosts.length} results
            {duplicatesRemoved > 0 ? ` · ${duplicatesRemoved} merged` : ''}
          </Text>
        </View>
      ) : null}

      {/* Feed */}
      <FlatList
        data={filteredPosts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={scan}
            tintColor={COLORS.accent}
          />
        }
        ListEmptyComponent={
          !isScanning ? (
            <View style={styles.empty}>
              <Ionicons name="radio-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No leaks found</Text>
              <Text style={styles.emptySubtext}>Pull to refresh or adjust filters</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 28,
    fontWeight: FONT.black,
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTime: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: FONT.medium,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.lg,
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
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 4,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 2,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  sortBtnActive: {
    backgroundColor: COLORS.accentDim,
  },
  sortText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: FONT.semibold,
  },
  sortTextActive: {
    color: COLORS.accent,
    fontWeight: FONT.bold,
  },
  divider: {
    flex: 1,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
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
    fontSize: 13,
    fontWeight: FONT.semibold,
  },
  filterTextActive: {
    color: COLORS.accent,
    fontWeight: FONT.bold,
  },
  filterBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: FONT.black,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 6,
    gap: 12,
  },
  statsDivider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.cardBorder,
    opacity: 0.5,
  },
  statsText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: FONT.medium,
    flexShrink: 0,
  },
  list: { paddingTop: 4 },
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
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  scanBtn: {
    marginTop: 16,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accent,
  },
  scanBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: FONT.bold,
  },
});
