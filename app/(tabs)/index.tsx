import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, SPACING } from '../../constants/theme';
import { GradientBackground } from '../../components/GradientBackground';
import { SearchBar } from '../../components/SearchBar';
import { CategoryPills } from '../../components/CategoryPills';
import { LeakCard } from '../../components/LeakCard';
import { ScanOverlay } from '../../components/ScanOverlay';
import { useLeakStore } from '../../store/useLeakStore';
import { fetchLeaks } from '../../lib/api';
import { deduplicatePosts } from '../../lib/dedup';
import type { LeakPost } from '../../lib/api';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const {
    filteredPosts,
    isScanning,
    duplicatesRemoved,
    lastScanTime,
    setPosts,
    setIsScanning,
    addScanLog,
    clearScanLogs,
    loadSavedPosts,
    loadCachedFeed,
  } = useLeakStore();

  const scan = useCallback(async () => {
    setIsScanning(true);
    clearScanLogs();
    try {
      const rawPosts = await fetchLeaks((log) => addScanLog(log));
      const deduped = deduplicatePosts(rawPosts);
      const removed = rawPosts.length - deduped.length;
      setPosts(deduped, removed);
    } catch (e) {
      // Silently fail — cached data remains
    }
    setIsScanning(false);
  }, [setPosts, setIsScanning, addScanLog, clearScanLogs]);

  useEffect(() => {
    loadSavedPosts();
    loadCachedFeed().then(() => {
      scan();
    });
  }, []);

  const renderItem = useCallback(({ item, index }: { item: LeakPost; index: number }) => (
    <LeakCard post={item} index={index} />
  ), []);

  const keyExtractor = useCallback((item: LeakPost) => item.id, []);

  return (
    <GradientBackground>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.logo}>LeakRadar</Text>
        <Text style={styles.subtitle}>Gaming Leaks & Rumours</Text>
      </View>

      <SearchBar />
      <CategoryPills />

      {/* Stats bar */}
      {lastScanTime && !isScanning && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            {filteredPosts.length} leaks found
          </Text>
          {duplicatesRemoved > 0 && (
            <Text style={styles.dedupText}>
              {duplicatesRemoved} duplicates removed
            </Text>
          )}
        </View>
      )}

      {/* Feed */}
      <FlatList
        data={filteredPosts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
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

      {/* Scan overlay */}
      <ScanOverlay />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  logo: {
    fontSize: 28,
    fontWeight: FONT.black,
    color: COLORS.accentGreen,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: FONT.medium,
    color: COLORS.textMuted,
    marginTop: -2,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  statsText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: FONT.medium,
  },
  dedupText: {
    color: COLORS.accentCyan,
    fontSize: 12,
    fontWeight: FONT.medium,
  },
  list: {
    paddingTop: 4,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: FONT.bold,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: FONT.medium,
    marginTop: 4,
  },
});
