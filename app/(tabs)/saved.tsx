import React, { useCallback } from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT } from '../../constants/theme';
import { GradientBackground } from '../../components/GradientBackground';
import { LeakCard } from '../../components/LeakCard';
import { useLeakStore } from '../../store/useLeakStore';
import type { LeakPost } from '../../lib/api';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const savedPosts = useLeakStore(s => s.savedPosts);

  const renderItem = useCallback(({ item }: { item: LeakPost }) => (
    <LeakCard post={item} />
  ), []);

  const keyExtractor = useCallback((item: LeakPost) => item.id, []);

  return (
    <GradientBackground>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Saved Leaks</Text>
        <Text style={styles.subtitle}>{savedPosts.length} saved</Text>
      </View>

      <FlatList
        data={savedPosts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyText}>No saved leaks</Text>
            <Text style={styles.emptySubtext}>Tap the star on any leak to save it</Text>
          </View>
        }
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: FONT.black,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: FONT.medium,
    color: COLORS.textMuted,
    marginTop: -2,
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
