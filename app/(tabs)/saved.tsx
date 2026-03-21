import React, { useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { COLORS, FONT, RADIUS, SHADOW, TOKENS } from '../../constants/theme';
import { GradientBackground } from '../../components/GradientBackground';
import { LeakCard } from '../../components/LeakCard';
import { useLeakStore } from '../../store/useLeakStore';
import type { LeakPost } from '../../lib/api';

// Animated empty state icon
function EmptyState() {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim,   { toValue: 1,    duration: 1800, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1,    duration: 1800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim,   { toValue: 0.85, duration: 1800, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.4,  duration: 1800, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={emptyStyles.wrap}>
      <Animated.View style={[emptyStyles.iconWrap, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        <View style={emptyStyles.iconGlow} />
        <Ionicons name="bookmark-outline" size={40} color={COLORS.accent} />
      </Animated.View>
      <Text style={emptyStyles.title}>No saved leaks</Text>
      <Text style={emptyStyles.subtitle}>Swipe right on any leak or tap the{'\n'}bookmark icon to save it here</Text>
      <View style={emptyStyles.hint}>
        <Ionicons name="arrow-forward" size={12} color={COLORS.textMuted} />
        <Text style={emptyStyles.hintText}>Swipe right to save</Text>
      </View>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
    paddingHorizontal: 40,
    gap: 12,
  },
  iconWrap: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconGlow: {
    position: 'absolute',
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.accent,
    opacity: 0.06,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: FONT.bold,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  hintText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONT.medium,
  },
});

// Tracked game card
function TrackedGameCard({ game, count, onUntrack, onPress }: {
  game: string; count: number;
  onUntrack: () => void; onPress: () => void;
}) {
  const countColor = count > 0 ? COLORS.neonGreen : COLORS.textMuted;
  return (
    <TouchableOpacity style={trackedStyles.card} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[`${COLORS.accent}10`, `${COLORS.card}`]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={trackedStyles.gradient}
      />
      <View style={trackedStyles.iconBox}>
        <Ionicons name="game-controller-outline" size={16} color={COLORS.accent} />
      </View>
      <View style={trackedStyles.info}>
        <Text style={trackedStyles.name} numberOfLines={1}>{game}</Text>
        <View style={trackedStyles.metaRow}>
          <View style={[trackedStyles.dot, { backgroundColor: countColor }]} />
          <Text style={[trackedStyles.meta, { color: countColor }]}>
            {count} leak{count !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} style={{ marginRight: 4 }} />
      <TouchableOpacity
        onPress={onUntrack}
        style={trackedStyles.untrackBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="bookmark" size={16} color={COLORS.accent} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const trackedStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  gradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  iconBox: {
    width: 32, height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 3 },
  name: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: FONT.bold,
    letterSpacing: -0.2,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  meta: { fontSize: 11, fontWeight: FONT.medium },
  untrackBtn: {
    padding: 4,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const savedPosts = useLeakStore(s => s.savedPosts);
  const trackedGames = useLeakStore(s => s.trackedGames);
  const toggleTrackGame = useLeakStore(s => s.toggleTrackGame);
  const posts = useLeakStore(s => s.posts);

  const renderItem = useCallback(({ item }: { item: LeakPost }) => (
    <LeakCard post={item} />
  ), []);

  const keyExtractor = useCallback((item: LeakPost) => item.id, []);

  const confirmedSaved = savedPosts.filter(p => p.verificationStatus === 'confirmed').length;
  const hotSaved       = savedPosts.filter(p => p.heat === 'hot').length;

  const ListHeader = (
    <>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.title}>Saved</Text>
          <Text style={styles.subtitle}>Your personal leak vault</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeNum}>{savedPosts.length}</Text>
          <Text style={styles.headerBadgeLbl}>saved</Text>
        </View>
      </View>

      {/* Mini stats row */}
      {savedPosts.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <View style={[styles.statDot, { backgroundColor: COLORS.neonGreen }]} />
            <Text style={styles.statChipText}>{confirmedSaved} Confirmed</Text>
          </View>
          <View style={styles.statChip}>
            <View style={[styles.statDot, { backgroundColor: COLORS.neonOrange }]} />
            <Text style={styles.statChipText}>{hotSaved} Hot</Text>
          </View>
          <View style={styles.statChip}>
            <Ionicons name="game-controller-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.statChipText}>{trackedGames.length} Tracked</Text>
          </View>
        </View>
      )}

      {/* Tracked games */}
      {trackedGames.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TRACKED GAMES</Text>
            <Text style={styles.sectionCount}>{trackedGames.length}</Text>
          </View>
          <View style={styles.trackedContainer}>
            {trackedGames.map(game => {
              const count = posts.filter(p => p.tags.includes(game)).length;
              return (
                <TrackedGameCard
                  key={game}
                  game={game}
                  count={count}
                  onUntrack={() => toggleTrackGame(game)}
                  onPress={() => router.push({ pathname: '/game/[name]', params: { name: game } })}
                />
              );
            })}
          </View>
        </>
      )}

      {/* Section divider */}
      {savedPosts.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SAVED LEAKS</Text>
          <Text style={styles.sectionCount}>{savedPosts.length}</Text>
        </View>
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
          savedPosts.length === 0 ? <EmptyState /> : null
        }
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: FONT.black,
    color: COLORS.textPrimary,
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
    fontWeight: FONT.medium,
  },
  headerBadge: {
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  headerBadgeNum: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: FONT.black,
    lineHeight: 22,
  },
  headerBadgeLbl: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: FONT.bold,
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statDot: {
    width: 5, height: 5, borderRadius: 3,
  },
  statChipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONT.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 18,
    marginRight: 16,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: FONT.heavy,
    color: COLORS.textMuted,
    letterSpacing: 1.2,
  },
  sectionCount: {
    fontSize: 10,
    fontWeight: FONT.bold,
    color: COLORS.accent,
    backgroundColor: COLORS.accentDim,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
    overflow: 'hidden',
  },
  trackedContainer: {
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 20,
  },
});
