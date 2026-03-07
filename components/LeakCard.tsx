import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { Swipeable, TouchableOpacity } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW, TOKENS } from '../constants/theme';
import { CredibilityRing } from './CredibilityRing';
import { useLeakStore } from '../store/useLeakStore';
import type { LeakPost, PostType } from '../lib/api';

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export const LeakCard = memo(function LeakCard({ post }: { post: LeakPost }) {
  const router = useRouter();
  const swipeableRef = useRef<Swipeable>(null);
  const savedPostIds = useLeakStore(s => s.savedPostIds);
  const toggleSavePost = useLeakStore(s => s.toggleSavePost);
  const isSaved = savedPostIds.has(post.id);
  const [thumbError, setThumbError] = useState(false);
  const hasImage = !!post.thumbnail && !thumbError;
  const isBreaking = post.heat === 'hot' && (Date.now() / 1000 - post.timestamp) < 2 * 3600;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const typeConfig  = TOKENS.postType[post.postType] ?? TOKENS.postType.news;
  const heatConfig  = TOKENS.heat[post.heat];
  const verifConfig = post.verificationStatus !== 'pending'
    ? TOKENS.verification[post.verificationStatus]
    : null;

  useEffect(() => {
    if (!isBreaking) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isBreaking]);

  const handlePress = () =>
    router.push({ pathname: '/leak/[id]', params: { id: post.id } });

  const handleSwipeSave = () => {
    toggleSavePost(post);
    swipeableRef.current?.close();
  };

  const renderLeftActions = (
    _: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({ inputRange: [0, 80], outputRange: [0.8, 1], extrapolate: 'clamp' });
    return (
      <TouchableOpacity style={styles.swipeAction} onPress={handleSwipeSave} activeOpacity={0.9}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={22} color={COLORS.accent} />
        </Animated.View>
        <Text style={styles.swipeLabel}>{isSaved ? 'Unsave' : 'Save'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      onSwipeableOpen={(dir) => { if (dir === 'right') handleSwipeSave(); }}
      friction={2} leftThreshold={40} overshootLeft={false}
    >
      <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.86}>
        {/* Breaking banner */}
        {isBreaking && (
          <View style={styles.breakingBanner}>
            <Animated.View style={[styles.breakingDot, { opacity: pulseAnim }]} />
            <Text style={styles.breakingText}>BREAKING</Text>
          </View>
        )}

        {/* Image — consistent 160px banner with gradient fade into content */}
        {hasImage && (
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: post.thumbnail }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setThumbError(true)}
            />
            <LinearGradient
              colors={['transparent', `${COLORS.card}cc`, COLORS.card]}
              locations={[0.35, 0.75, 1]}
              style={styles.imageGradient}
              pointerEvents="none"
            />
            {/* Credibility ring overlaid on image bottom-right */}
            <View style={styles.imageRing}>
              <CredibilityRing score={post.credibility} size={40} strokeWidth={3} />
            </View>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Badge row + time + save */}
          <View style={styles.topRow}>
            <View style={styles.badgesRow}>
              <NeonBadge label={heatConfig.label} color={heatConfig.color} />
              <NeonBadge label={typeConfig.label} color={typeConfig.color} dot />
              {verifConfig && <NeonBadge label={verifConfig.label} color={verifConfig.color} />}
            </View>
            <View style={styles.metaRight}>
              <Text style={styles.timeText}>{timeAgo(post.timestamp)}</Text>
              <TouchableOpacity
                onPress={() => toggleSavePost(post)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={16}
                  color={isSaved ? COLORS.accent : COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={3}>{post.title}</Text>

          {/* Summary — only when no image */}
          {post.summary && !hasImage && (
            <Text style={styles.summary} numberOfLines={2}>{post.summary}</Text>
          )}

          {/* Source count */}
          {post.sources.length > 1 && (
            <View style={styles.sourceRow}>
              <View style={styles.sourceConfirmDot} />
              <Text style={styles.sourceConfirmText}>
                Reported by {post.sources.length} sources
              </Text>
            </View>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {post.tags.slice(0, 3).map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={styles.tagChip}
                  onPress={() => router.push({ pathname: '/game/[name]', params: { name: tag } })}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                  <Ionicons name="chevron-forward" size={8} color={COLORS.accent} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            {!hasImage && <CredibilityRing score={post.credibility} compact />}
            {hasImage && <View />}
            <View style={styles.footerRight}>
              {post.score > 0 && (
                <View style={styles.stat}>
                  <Ionicons name="arrow-up" size={10} color={COLORS.textMuted} />
                  <Text style={styles.statText}>{formatNumber(post.score)}</Text>
                </View>
              )}
              {post.comments > 0 && (
                <View style={styles.stat}>
                  <Ionicons name="chatbubble-outline" size={10} color={COLORS.textMuted} />
                  <Text style={styles.statText}>{formatNumber(post.comments)}</Text>
                </View>
              )}
              <View style={styles.categoryChip}>
                <Text style={styles.categoryText}>{post.category}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
});

// ── Sub-components ───────────────────────────────────────────────────────────
function NeonBadge({ label, color, dot }: { label: string; color: string; dot?: boolean }) {
  return (
    <View style={[badge.wrap, { borderColor: `${color}40`, backgroundColor: `${color}16` }]}>
      {dot && <View style={[badge.dot, { backgroundColor: color }]} />}
      <Text style={[badge.text, { color }]}>{label}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  text: {
    fontSize: 9,
    fontWeight: FONT.heavy,
    letterSpacing: 0.7,
  },
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  breakingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: `${COLORS.neonRed}10`,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.neonRed}22`,
  },
  breakingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.neonRed,
  },
  breakingText: {
    color: COLORS.neonRed,
    fontSize: 9,
    fontWeight: FONT.heavy,
    letterSpacing: 1,
  },
  // ── Image ─────────────────────────────────────────────────────────────────
  imageWrap: {
    position: 'relative',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  imageRing: {
    position: 'absolute',
    bottom: 8,
    right: 12,
  },
  // ── Content ───────────────────────────────────────────────────────────────
  content: {
    padding: 12,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    flex: 1,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONT.medium,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: FONT.bold,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  summary: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceConfirmDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.neonGreen,
  },
  sourceConfirmText: {
    color: COLORS.neonGreen,
    fontSize: 11,
    fontWeight: FONT.semibold,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  tagText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: FONT.semibold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONT.medium,
  },
  categoryChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  categoryText: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: FONT.bold,
    letterSpacing: 0.3,
  },
  swipeAction: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.card,
    marginBottom: 10,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 68,
    gap: 4,
  },
  swipeLabel: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: FONT.bold,
  },
});
