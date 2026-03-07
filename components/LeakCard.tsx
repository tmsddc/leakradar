import React, { memo, useRef, useState } from 'react';
import { StyleSheet, Text, View, Animated, Image } from 'react-native';
import { Swipeable, TouchableOpacity } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, FONT, SHADOW } from '../constants/theme';
import { HeatBadge } from './HeatBadge';
import { CredibilityBar } from './CredibilityBar';
import { useLeakStore } from '../store/useLeakStore';
import { Ionicons } from '@expo/vector-icons';
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

// Left accent bar color based on heat
const HEAT_ACCENT: Record<string, string> = {
  hot:    COLORS.red,
  rising: COLORS.amber,
  new:    COLORS.accentCyan,
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

  const heatAccent = HEAT_ACCENT[post.heat] ?? COLORS.accent;

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
        {/* Left heat accent stripe */}
        <View style={[styles.accentStripe, { backgroundColor: heatAccent }]} />

        {/* Top image – edge-to-edge within card */}
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
          {/* Header: badges + time + save */}
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

          {/* Footer: cred + stats + category */}
          <View style={styles.footer}>
            <CredibilityBar score={post.credibility} showLabel={false} compact />
            <View style={styles.footerRight}>
              {post.score > 0 ? (
                <View style={styles.statItem}>
                  <Ionicons name="arrow-up" size={11} color={COLORS.textMuted} />
                  <Text style={styles.statText}>{formatNumber(post.score)}</Text>
                </View>
              ) : null}
              {post.comments > 0 ? (
                <View style={styles.statItem}>
                  <Ionicons name="chatbubble-outline" size={11} color={COLORS.textMuted} />
                  <Text style={styles.statText}>{formatNumber(post.comments)}</Text>
                </View>
              ) : null}
              <View style={styles.categoryBadge}>
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
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  accentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    zIndex: 1,
  },
  thumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.surface,
  },
  content: {
    padding: 14,
    paddingLeft: 17, // offset for accent stripe
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 9,
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
    gap: 8,
    marginLeft: 8,
  },
  flairBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
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
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
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
  title: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: FONT.bold,
    lineHeight: 22,
    marginBottom: 5,
    letterSpacing: -0.1,
  },
  summary: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONT.medium,
  },
  categoryBadge: {
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
    fontWeight: FONT.semibold,
    letterSpacing: 0.2,
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
    gap: 4,
  },
  swipeLabel: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: FONT.bold,
  },
});
