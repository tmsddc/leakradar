import React, { memo, useRef, useState } from 'react';
import { StyleSheet, Text, View, Animated, Image } from 'react-native';
import { Swipeable, TouchableOpacity } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, FONT, SHADOW } from '../constants/theme';
import { HeatBadge } from './HeatBadge';
import { CredibilityBar } from './CredibilityBar';
import { useLeakStore } from '../store/useLeakStore';
import { Ionicons } from '@expo/vector-icons';
import type { LeakPost, PostType } from '../lib/api';

interface LeakCardProps {
  post: LeakPost;
  index?: number;
}

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

const POST_TYPE_CONFIG: Record<PostType, { label: string; color: string }> = {
  leak:   { label: 'LEAK',   color: COLORS.red   },
  rumour: { label: 'RUMOUR', color: COLORS.amber  },
  news:   { label: 'NEWS',   color: COLORS.textMuted },
};

const VERIFICATION_CONFIG = {
  confirmed: { label: 'Confirmed', color: COLORS.green },
  denied:    { label: 'Denied',    color: COLORS.red   },
  pending:   null,
};

export const LeakCard = memo(function LeakCard({ post }: LeakCardProps) {
  const router = useRouter();
  const swipeableRef = useRef<Swipeable>(null);
  const savedPostIds = useLeakStore(s => s.savedPostIds);
  const toggleSavePost = useLeakStore(s => s.toggleSavePost);
  const isSaved = savedPostIds.has(post.id);
  const verification = VERIFICATION_CONFIG[post.verificationStatus];
  const [thumbError, setThumbError] = useState(false);
  const hasImage = post.thumbnail && !thumbError;

  const handlePress = () => {
    router.push({ pathname: '/leak/[id]', params: { id: post.id } });
  };

  const handleSwipeSave = () => {
    toggleSavePost(post);
    swipeableRef.current?.close();
  };

  const renderLeftActions = (
    _: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [0.8, 1],
      extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity style={styles.swipeAction} onPress={handleSwipeSave} activeOpacity={0.9}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={COLORS.accent}
          />
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
      friction={2}
      leftThreshold={40}
      overshootLeft={false}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.86}
      >
        {/* Image – edge-to-edge */}
        {hasImage ? (
          <Image
            source={{ uri: post.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
            onError={() => setThumbError(true)}
          />
        ) : null}

        {/* Content */}
        <View style={styles.content}>

          {/* Top row: badges + time + save */}
          <View style={styles.topRow}>
            <View style={styles.badgesRow}>
              <HeatBadge heat={post.heat} />
              {/* Post type badge */}
              {(() => {
                const tc = POST_TYPE_CONFIG[post.postType] ?? POST_TYPE_CONFIG['news'];
                return (
                  <View style={[styles.typeBadge, { borderColor: `${tc.color}40`, backgroundColor: `${tc.color}14` }]}>
                    <Text style={[styles.typeText, { color: tc.color }]}>{tc.label}</Text>
                  </View>
                );
              })()}
              {post.flair ? (
                <View style={styles.flairBadge}>
                  <Text style={styles.flairText} numberOfLines={1} ellipsizeMode="tail">
                    {post.flair}
                  </Text>
                </View>
              ) : null}
              {verification ? (
                <View style={[styles.verificationDot, { backgroundColor: `${verification.color}22` }]}>
                  <View style={[styles.verificationDotInner, { backgroundColor: verification.color }]} />
                  <Text style={[styles.verificationLabel, { color: verification.color }]}>
                    {verification.label}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.metaRight}>
              <Text style={styles.timeText}>{timeAgo(post.timestamp)}</Text>
              <TouchableOpacity
                onPress={() => toggleSavePost(post)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={17}
                  color={isSaved ? COLORS.accent : COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={3}>{post.title}</Text>

          {/* Summary */}
          {post.summary ? (
            <Text style={styles.summary} numberOfLines={2}>{post.summary}</Text>
          ) : null}

          {/* Source count — shown when merged from multiple sources */}
          {post.sources.length > 1 ? (
            <View style={styles.sourceRow}>
              <View style={styles.sourceConfirmDot} />
              <Text style={styles.sourceConfirmText}>
                Reported by {post.sources.length} sources
              </Text>
            </View>
          ) : null}

          {/* Game tags — tappable, navigate to Game Detail */}
          {post.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {post.tags.slice(0, 3).map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={styles.tagChip}
                  onPress={() => router.push({ pathname: '/game/[name]', params: { name: tag } })}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="stats-chart-outline" size={9} color={COLORS.accent} />
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {/* Footer */}
          <View style={styles.footer}>
            <CredibilityBar score={post.credibility} showLabel={false} compact />
            <View style={styles.footerRight}>
              {post.score > 0 ? (
                <View style={styles.stat}>
                  <Ionicons name="arrow-up" size={11} color={COLORS.textMuted} />
                  <Text style={styles.statText}>{formatNumber(post.score)}</Text>
                </View>
              ) : null}
              {post.comments > 0 ? (
                <View style={styles.stat}>
                  <Ionicons name="chatbubble-outline" size={11} color={COLORS.textMuted} />
                  <Text style={styles.statText}>{formatNumber(post.comments)}</Text>
                </View>
              ) : null}
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

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  thumbnail: {
    width: '100%',
    height: 190,
    backgroundColor: COLORS.surface,
  },
  content: {
    padding: 14,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    // flex:1 + overflow hidden on flair prevents layout break
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 9,
    fontWeight: FONT.heavy,
    letterSpacing: 0.6,
  },
  flairBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    maxWidth: 120,
    overflow: 'hidden',
  },
  flairText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: FONT.medium,
  },
  verificationDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  verificationDotInner: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  verificationLabel: {
    fontSize: 10,
    fontWeight: FONT.bold,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: FONT.medium,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: FONT.bold,
    lineHeight: 23,
    letterSpacing: -0.2,
  },
  summary: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    marginTop: 2,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  categoryText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: FONT.bold,
    letterSpacing: 0.3,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceConfirmDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
  },
  sourceConfirmText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: FONT.semibold,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  tagText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: FONT.semibold,
  },
  swipeAction: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.card,
    marginBottom: 10,
    marginLeft: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    gap: 4,
  },
  swipeLabel: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: FONT.bold,
  },
});
