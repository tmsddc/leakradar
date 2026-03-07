import React, { useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, RADIUS } from '../../constants/theme';
import { GradientBackground } from '../../components/GradientBackground';
import { LeakCard } from '../../components/LeakCard';
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
        <Text style={styles.title}>Saved</Text>
        <Text style={styles.subtitle}>{savedPosts.length} leaks saved</Text>
      </View>

      {trackedGames.length > 0 ? (
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
      ) : null}
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
            <Text style={styles.emptyTitle}>No saved leaks</Text>
            <Text style={styles.emptySubtext}>
              Tap the bookmark icon or swipe right on any leak to save it
            </Text>
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
    fontSize: 26,
    fontWeight: FONT.black,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: -2,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: FONT.bold,
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
    marginLeft: 18,
  },
  trackedContainer: {
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 20,
  },
  trackedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
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
  untrackBtn: { padding: 4 },
  untrackText: {
    fontSize: 20,
    color: COLORS.accent,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: FONT.bold,
    marginBottom: 8,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
