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
import type { LeakPost } from '../../lib/api';

const CRED_OPTIONS = [
  { label: 'All',  value: 0  },
  { label: '60%+', value: 60 },
  { label: '80%+', value: 80 },
];

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    filteredPosts, isScanning, duplicatesRemoved, lastScanTime,
    setPosts, setIsScanning, addScanLog, clearScanLogs, loadSavedPosts,
    loadCachedFeed, loadTrackedGames, markAllRead, settings, loadSettings,
    minCredibility, setMinCredibility,
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
      {/* ── Header ─────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTitle}>
          <Text style={styles.logo}>LeakRadar</Text>
          <View style={styles.liveDot} />
        </View>
        <TouchableOpacity
          onPress={scan}
          style={[styles.refreshBtn, isScanning && styles.refreshBtnScanning]}
          disabled={isScanning}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isScanning ? 'radio-outline' : 'refresh-outline'}
            size={18}
            color={isScanning ? COLORS.accent : COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* ── Search ─────────────────────────────── */}
      <SearchBar />

      {/* ── Category pills ─────────────────────── */}
      <CategoryPills />

      {/* ── Combined sort + cred + stats row ───── */}
      <View style={styles.filterBar}>
        <SortPicker style={styles.sortPicker} />

        <View style={styles.credRow}>
          {CRED_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.credBtn, minCredibility === opt.value && styles.credBtnActive]}
              onPress={() => setMinCredibility(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.credBtnText, minCredibility === opt.value && styles.credBtnTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Stats row ──────────────────────────── */}
      {timeStr && !isScanning ? (
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {filteredPosts.length} leaks · {timeStr}
            {duplicatesRemoved > 0 ? ` · ${duplicatesRemoved} dupes` : ''}
          </Text>
        </View>
      ) : null}

      {/* ── Feed ───────────────────────────────── */}
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
    paddingHorizontal: 16,
    paddingBottom: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  logo: {
    fontSize: 24,
    fontWeight: FONT.black,
    color: COLORS.textPrimary,
    letterSpacing: -0.8,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtnScanning: {
    borderColor: COLORS.accentBorder,
    backgroundColor: COLORS.accentDim,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 6,
    gap: 8,
  },
  sortPicker: {
    // inherits SortPicker defaults, no overrides needed
  },
  credRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 'auto',
  },
  credBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  credBtnActive: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accentBorder,
  },
  credBtnText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONT.semibold,
  },
  credBtnTextActive: {
    color: COLORS.accent,
  },
  statsRow: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  statsText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: FONT.medium,
  },
  list: { paddingTop: 4 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: FONT.bold,
    marginBottom: 6,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  scanBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  scanBtnText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: FONT.bold,
  },
});
