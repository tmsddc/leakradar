import React, { useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, RADIUS } from '../../constants/theme';
import { GradientBackground } from '../../components/GradientBackground';
import { LeakCard } from '../../components/LeakCard';
import { GlassPanel } from '../../components/GlassPanel';
import { useLeakStore } from '../../store/useLeakStore';
import type { LeakPost } from '../../lib/api';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const savedPosts = useLeakStore(s => s.savedPosts);
  const trackedGames = useLeakStore(s => s.trackedGames);
  const toggleTrackGame = useLeakStore(s => s.toggleTrackGame);
  const posts = useLeakStore(s => s.posts);

  const renderItem = useCallback(({ item }: { item: LeakPost }) => (
    <LeakCard post={item} />
  ), []);

  const keyExtractor = useCallback((item: LeakPost) => item.id, []);

  const ListHeader = (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Saved Leaks</Text>
        <Text style={styles.subtitle}>{savedPosts.length} saved</Text>
      </View>

      {trackedGames.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>TRACKED GAMES</Text>
          <View style={styles.trackedContainer}>
            {trackedGames.map(game => {
              const count = posts.filter(p => p.tags.includes(game)).length;
              return (
                <View key={game} style={styles.trackedCard}>
                  <View style={styles.trackedInfo}>
                    <Text style={styles.trackedName}>{game}</Text>
                    <Text style={styles.trackedMeta}>{count} leak{count !== 1 ? 's' : ''}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleTrackGame(game)} style={styles.untrackBtn}>
                    <Text style={styles.untrackText}>★</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
          <Text style={styles.sectionTitle}>SAVED POSTS</Text>
        </>
      )}
    </>
  );

  return (
    <GradientBackground>
      <FlatList
        data={savedPosts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyText}>No saved leaks</Text>
            <Text style={styles.emptySubtext}>Tap ☆ or swipe right on any leak to save it</Text>
          </View>
        }
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: FONT.black,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: FONT.medium,
    color: COLORS.textMuted,
    marginTop: -2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: FONT.bold,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
    marginLeft: 20,
  },
  trackedContainer: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  trackedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  trackedInfo: { flex: 1 },
  trackedName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: FONT.bold,
  },
  trackedMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  untrackBtn: {
    padding: 4,
  },
  untrackText: {
    fontSize: 22,
    color: COLORS.accentGreen,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
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
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
