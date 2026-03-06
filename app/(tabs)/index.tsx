import React, { useCallback, useEffect } from 'react';
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

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const {
    filteredPosts, isScanning, duplicatesRemoved, lastScanTime, unreadCount,
    setPosts, setIsScanning, addScanLog, clearScanLogs, loadSavedPosts,
    loadCachedFeed, loadTrackedGames, markAllRead,
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

  useEffect(() => {
    loadSavedPosts();
    loadTrackedGames();
    loadCachedFeed().then(() => scan());
  }, []);

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

      {/* Stats bar */}
      {lastScanTime && !isScanning && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            {filteredPosts.length} leaks
            {timeStr ? ` · updated ${timeStr}` : ''}
          </Text>
          {duplicatesRemoved > 0 && (
            <Text style={styles.dedupText}>{duplicatesRemoved} dupes removed</Text>
          )}
        </View>
      )}

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
  refreshIcon: {
    fontSize: 20,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 4,
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
});
