import React, { memo, useRef, useState } from 'react';
import { StyleSheet, Text, View, Animated, Image } from 'react-native';
import { Swipeable, TouchableOpacity } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, FONT, SHADOW } from '../constants/theme';
import { HeatBadge } from './HeatBadge';
import { SourceBadge } from './SourceBadge';
import { CredibilityBar } from './CredibilityBar';
import { useLeakStore } from '../store/useLeakStore';
import type { LeakPost } from '../lib/api';

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

const VERIFICATION_CONFIG = {
  confirmed: { label: 'Confirmed', color: COLORS.green, bg: `${COLORS.green}18` },
  denied:    { label: 'Denied',    color: COLORS.red,   bg: `${COLORS.red}18`   },
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
        <Animated.Text style={[styles.swipeIcon, { transform: [{ scale }] }]}>
          {isSaved ? '★' : '☆'}
        </Animated.Text>
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
        activeOpacity={0.88}
      >
        {/* Header row */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <HeatBadge heat={post.heat} />
            {post.flair ? (
              <View style={styles.flairBadge}>
                <Text style={styles.flairText}>{post.flair}</Text>
              </View>
            ) : null}
            {verification ? (
              <View style={[styles.verificationBadge, { backgroundColor: verification.bg }]}>
                <Text style={[styles.verificationText, { color: verification.color }]}>
                  {verification.label}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.timeText}>{timeAgo(post.timestamp)}</Text>
            <TouchableOpacity
              onPress={() => toggleSavePost(post)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.saveIcon, isSaved && styles.saveIconActive]}>
                {isSaved ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Thumbnail */}
        {post.thumbnail && !thumbError ? (
          <Image
            source={{ uri: post.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
            onError={() => setThumbError(true)}
          />
        ) : null}

        {/* Title */}
        <Text style={styles.title} numberOfLines={3}>{post.title}</Text>

        {/* Summary */}
        {post.summary ? (
          <Text style={styles.summary} numberOfLines={2}>{post.summary}</Text>
        ) : null}

        {/* Credibility */}
        <View style={styles.credibilityRow}>
          <CredibilityBar score={post.credibility} showLabel={false} compact />
        </View>

        {/* Sources */}
        <View style={styles.sourcesRow}>
          {post.sources.slice(0, 3).map(source => (
            <SourceBadge key={source} source={source} />
          ))}
          {post.sources.length > 3 ? (
            <View style={styles.moreSourcesBadge}>
              <Text style={styles.moreSourcesText}>+{post.sources.length - 3}</Text>
            </View>
          ) : null}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.stats}>
            {post.score > 0 ? (
              <Text style={styles.statText}>{formatNumber(post.score)} votes</Text>
            ) : null}
            {post.comments > 0 ? (
              <Text style={styles.statText}>{formatNumber(post.comments)} comments</Text>
            ) : null}
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{post.category}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 15,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 8,
  },
  flairBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  flairText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: FONT.medium,
  },
  verificationBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  verificationText: {
    fontSize: 10,
    fontWeight: FONT.bold,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: FONT.medium,
  },
  saveIcon: {
    color: COLORS.textMuted,
    fontSize: 18,
  },
  saveIconActive: {
    color: COLORS.accent,
  },
  thumbnail: {
    width: '100%',
    height: 160,
    borderRadius: RADIUS.md,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: FONT.bold,
    lineHeight: 21,
    marginBottom: 6,
  },
  summary: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  credibilityRow: {
    marginBottom: 10,
  },
  sourcesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  moreSourcesBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  moreSourcesText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: FONT.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  statText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONT.medium,
  },
  categoryBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  categoryText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: FONT.semibold,
  },
  swipeAction: {
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderRadius: RADIUS.card,
    marginBottom: 10,
    marginLeft: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  swipeIcon: {
    fontSize: 22,
    color: COLORS.accent,
  },
  swipeLabel: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: FONT.bold,
    marginTop: 2,
  },
});
