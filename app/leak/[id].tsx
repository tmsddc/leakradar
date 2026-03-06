import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, RADIUS, SPACING, SHADOW } from '../../constants/theme';
import { GradientBackground } from '../../components/GradientBackground';
import { GlassPanel } from '../../components/GlassPanel';
import { HeatBadge } from '../../components/HeatBadge';
import { SourceBadge } from '../../components/SourceBadge';
import { useLeakStore } from '../../store/useLeakStore';

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

export default function LeakDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const posts = useLeakStore(s => s.posts);
  const savedPosts = useLeakStore(s => s.savedPosts);
  const savedPostIds = useLeakStore(s => s.savedPostIds);
  const toggleSavePost = useLeakStore(s => s.toggleSavePost);

  const post = posts.find(p => p.id === id) || savedPosts.find(p => p.id === id);

  if (!post) {
    return (
      <GradientBackground>
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <Text style={styles.errorText}>Post not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  const isSaved = savedPostIds.has(post.id);

  const handleOpenOriginal = () => {
    Linking.openURL(post.url);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.title}\n\n${post.url}`,
        title: post.title,
      });
    } catch {}
  };

  return (
    <GradientBackground>
      {/* Header bar */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => toggleSavePost(post)} style={styles.headerButton}>
            <Text style={styles.saveText}>{isSaved ? '★ Saved' : '☆ Save'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>↗ Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Badges row */}
        <View style={styles.badgesRow}>
          <HeatBadge heat={post.heat} />
          {post.flair && (
            <View style={styles.flairBadge}>
              <Text style={styles.flairText}>{post.flair}</Text>
            </View>
          )}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{post.category}</Text>
          </View>
          <Text style={styles.timeText}>{timeAgo(post.timestamp)}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{post.title}</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <GlassPanel style={styles.statBox}>
            <Text style={styles.statValue}>{formatNumber(post.score)}</Text>
            <Text style={styles.statLabel}>Upvotes</Text>
          </GlassPanel>
          <GlassPanel style={styles.statBox}>
            <Text style={styles.statValue}>{formatNumber(post.comments)}</Text>
            <Text style={styles.statLabel}>Comments</Text>
          </GlassPanel>
          <GlassPanel style={styles.statBox}>
            <Text style={styles.statValue}>{post.sources.length}</Text>
            <Text style={styles.statLabel}>Sources</Text>
          </GlassPanel>
        </View>

        {/* Body */}
        {post.summary ? (
          <GlassPanel style={styles.bodyPanel}>
            <Text style={styles.bodyText}>{post.summary}</Text>
          </GlassPanel>
        ) : null}

        {/* Sources */}
        <Text style={styles.sectionTitle}>Sources</Text>
        <GlassPanel style={styles.sourcesPanel}>
          <View style={styles.sourcesGrid}>
            {post.sources.map(source => (
              <SourceBadge key={source} source={source} />
            ))}
          </View>
        </GlassPanel>

        {/* Open Original */}
        <TouchableOpacity style={styles.openButton} onPress={handleOpenOriginal}>
          <Text style={styles.openButtonText}>Open Original Thread ↗</Text>
        </TouchableOpacity>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerButtonText: {
    color: COLORS.accentCyan,
    fontSize: 15,
    fontWeight: FONT.semibold,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  saveText: {
    color: COLORS.accentGreen,
    fontSize: 15,
    fontWeight: FONT.semibold,
  },
  content: {
    padding: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  flairBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  flairText: {
    color: '#c4b5fd',
    fontSize: 11,
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
    fontSize: 11,
    fontWeight: FONT.semibold,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: FONT.medium,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: FONT.heavy,
    lineHeight: 28,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: FONT.heavy,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONT.medium,
    marginTop: 2,
  },
  bodyPanel: {
    marginBottom: 16,
  },
  bodyText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: FONT.regular,
    lineHeight: 22,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: FONT.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sourcesPanel: {
    marginBottom: 20,
  },
  sourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  openButton: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOW.card,
  },
  openButtonText: {
    color: COLORS.accentGreen,
    fontSize: 16,
    fontWeight: FONT.bold,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: FONT.semibold,
  },
  backButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backButtonText: {
    color: COLORS.accentCyan,
    fontSize: 16,
    fontWeight: FONT.semibold,
  },
});
