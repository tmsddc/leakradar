import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS } from '../../constants/theme';
import { GradientBackground } from '../../components/GradientBackground';
import { SearchBar } from '../../components/SearchBar';
import { CategoryPills } from '../../components/CategoryPills';
import { LeakCard } from '../../components/LeakCard';
import { ScanOverlay } from '../../components/ScanOverlay';
import { SortPicker } from '../../components/SortPicker';
import { useLeakStore } from '../../store/useLeakStore';
import { fetchLeaks } from '../../lib/api';
import { deduplicatePosts } from '../../lib/dedup';
import type { LeakPost, PostType } from '../../lib/api';
import type { PostTypeFilter } from '../../store/useLeakStore';

const CRED_OPTIONS = [
  { label: 'All',  value: 0  },
  { label: '60%+', value: 60 },
  { label: '80%+', value: 80 },
];

const TYPE_OPTIONS: { label: string; value: PostTypeFilter }[] = [
  { label: 'All',    value: 'all'    },
  { label: 'Leaks',  value: 'leak'   },
  { label: 'Rumours',value: 'rumour' },
  { label: 'News',   value: 'news'   },
];

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    filteredPosts, isScanning, duplicatesRemoved, lastScanTime,
    setPosts, setIsScanning, addScanLog, clearScanLogs, loadSavedPosts,
    loadCachedFeed, loadTrackedGames, markAllRead, settings, loadSettings,
    minCredibility, setMinCredibility,
    postTypeFilter, setPostTypeFilter,
  } = useLeakStore();

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

      {/* Search */}
      <SearchBar />

      {/* Category pills */}
      <CategoryPills />

      {/* Type filter row */}
      <View style={styles.typeRow}>
        {TYPE_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.typeBtn, postTypeFilter === opt.value && styles.typeBtnActive]}
            onPress={() => setPostTypeFilter(opt.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.typeBtnText, postTypeFilter === opt.value && styles.typeBtnTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Controls: Sort + divider + Cred filter */}
      <View style={styles.controlsRow}>
        <SortPicker />
        <View style={styles.separator} />
        <View style={styles.credRow}>
          {CRED_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setMinCredibility(opt.value)}
              activeOpacity={0.6}
            >
              <Text style={[
                styles.credLabel,
                minCredibility === opt.value && styles.credLabelActive,
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats divider */}
      {timeStr && !isScanning ? (
        <View style={styles.statsRow}>
          <View style={styles.statsDivider} />
          <Text style={styles.statsText}>
            {filteredPosts.length} leaks · {timeStr}
            {duplicatesRemoved > 0 ? ` · ${duplicatesRemoved} dupes` : ''}
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
  typeRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 4,
  },
  typeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  typeBtnActive: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accentBorder,
  },
  typeBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: FONT.semibold,
  },
  typeBtnTextActive: {
    color: COLORS.accent,
    fontWeight: FONT.bold,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  separator: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: 12,
  },
  credRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  credLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: FONT.semibold,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  credLabelActive: {
    color: COLORS.accent,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 6,
    gap: 12,
  },
  statsDivider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.cardBorder,
    opacity: 0.6,
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
