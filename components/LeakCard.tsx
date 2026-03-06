import React, { memo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, FONT, SPACING, SHADOW } from '../constants/theme';
import { HeatBadge } from './HeatBadge';
import { SourceBadge } from './SourceBadge';
import { useLeakStore } from '../store/useLeakStore';
import type { LeakPost } from '../lib/api';

interface LeakCardProps {
  post: LeakPost;
  index?: number;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export const LeakCard = memo(function LeakCard({ post, index = 0 }: LeakCardProps) {
  const router = useRouter();
  const savedPostIds = useLeakStore(s => s.savedPostIds);
  const toggleSavePost = useLeakStore(s => s.toggleSavePost);
  const isSaved = savedPostIds.has(post.id);

  const handlePress = () => {
    router.push({ pathname: '/leak/[id]', params: { id: post.id } });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      {/* Top highlight line */}
      <View style={styles.highlight} />

      {/* Header row: heat badge + time + save */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <HeatBadge heat={post.heat} />
          {post.flair && (
            <View style={styles.flairBadge}>
              <Text style={styles.flairText}>{post.flair}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.timeText}>{timeAgo(post.timestamp)}</Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              toggleSavePost(post);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.saveIcon}>{isSaved ? '★' : '☆'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={3}>
        {post.title}
      </Text>

      {/* Summary */}
      {post.summary ? (
        <Text style={styles.summary} numberOfLines={2}>
          {post.summary}
        </Text>
      ) : null}

      {/* Sources row */}
      <View style={styles.sourcesRow}>
        {post.sources.slice(0, 3).map(source => (
          <SourceBadge key={source} source={source} />
        ))}
        {post.sources.length > 3 && (
          <View style={styles.moreSourcesBadge}>
            <Text style={styles.moreSourcesText}>+{post.sources.length - 3}</Text>
          </View>
        )}
      </View>

      {/* Bottom row: stats + category */}
      <View style={styles.footer}>
        <View style={styles.stats}>
          <Text style={styles.statText}>▲ {formatNumber(post.score)}</Text>
          <Text style={styles.statText}>💬 {formatNumber(post.comments)}</Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{post.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 16,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.glassHighlight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flairBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  flairText: {
    color: '#c4b5fd',
    fontSize: 10,
    fontWeight: FONT.medium,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: FONT.medium,
  },
  saveIcon: {
    color: COLORS.accentGreen,
    fontSize: 20,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: FONT.bold,
    lineHeight: 22,
    marginBottom: 6,
  },
  summary: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: FONT.regular,
    lineHeight: 18,
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    gap: 12,
  },
  statText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: FONT.medium,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  categoryText: {
    color: COLORS.accentCyan,
    fontSize: 10,
    fontWeight: FONT.semibold,
  },
});
