import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, SPACING } from '../../constants/theme';
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
  { label: 'All', value: 0 },
  { label: '60%+', value: 60 },
  { label: '80%+', value: 80 },
];

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    filteredPosts, isScanning, duplicatesRemoved, lastScanTime, unreadCount,
    setPosts, setIsScanning, addScanLog, clearScanLogs, loadSavedPosts,
    loadCachedFeed, loadTrackedGames, markAllRead, settings, loadSettings,
    minCredibility, setMinCredibility,
  } = useLeakStore();

  const scan = useCallback(async () => {
    setIsScanning(true);
    clearScanLogs();
    try {
      const rawPosts = await fetchLeaks((log) => addScanLog(log));
      const deduped = deduplicatePosts(rawPosts);
      await setPosts(deduped, rawPosts.length - deduped.length);
    } catch {}
    setIsScanning(false);
  }, [setPosts, setIsScanning, addScanLog, clearScanLogs]);

  // Schedule next auto-refresh
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

  // Re-schedule on settings change
  useEffect(() => {
    scheduleRefresh();
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, [scheduleRefresh]);

  // Mark all read when user opens feed
  useEffect(() => {
    if (!isScanning && filteredPosts.length > 0) {
      markAllRead();
    }
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
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.logo}>LeakRadar</Text>
          <Text style={styles.subtitle}>Gaming Leaks & Rumours · Live</Text>
        </View>
        <TouchableOpacity onPress={scan} style={styles.refreshBtn} disabled={isScanning}>
          <Text style={styles.refreshIcon}>{isScanning ? '⏳' : '🔄'}</Text>
        </TouchableOpacity>
      </View>

      <SearchBar />
      <CategoryPills />
      <SortPicker />

      {/* Credibility filter */}
      <View style={styles.credRow}>
        <Text style={styles.credLabel}>Min cred:</Text>
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
        {/* Stats */}
        {lastScanTime && !isScanning && (
          <View style={styles.statsInline}>
            <Text style={styles.statsText}>
              {filteredPosts.length} leaks{timeStr ? ` · ${timeStr}` : ''}
            </Text>
            {duplicatesRemoved > 0 && (
              <Text style={styles.dedupText}> · {duplicatesRemoved} dupes</Text>
            )}
          </View>
        )}
      </View>

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
            tintColor={COLORS.accentCyan}
          />
        }
        ListEmptyComponent={
          !isScanning ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📡</Text>
              <Text style={styles.emptyText}>No leaks found</Text>
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
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logo: {
    fontSize: 28,
    fontWeight: FONT.black,
    color: COLORS.accentGreen,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: FONT.medium,
    color: COLORS.textMuted,
    marginTop: -2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  refreshIcon: { fontSize: 20 },
  credRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 6,
    gap: 6,
    flexWrap: 'wrap',
  },
  credLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONT.medium,
  },
  credBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  credBtnActive: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderColor: 'rgba(52,211,153,0.4)',
  },
  credBtnText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONT.semibold,
  },
  credBtnTextActive: {
    color: COLORS.accentGreen,
  },
  statsInline: {
    flexDirection: 'row',
    marginLeft: 'auto',
    alignItems: 'center',
  },
  statsText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: FONT.medium,
  },
  dedupText: {
    color: COLORS.accentCyan,
    fontSize: 11,
    fontWeight: FONT.medium,
  },
  list: { paddingTop: 4 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: FONT.bold,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  scanBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
  },
  scanBtnText: {
    color: COLORS.accentGreen,
    fontSize: 15,
    fontWeight: FONT.bold,
  },
});
