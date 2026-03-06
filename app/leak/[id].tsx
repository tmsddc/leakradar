import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking, Share, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, RADIUS, SHADOW } from '../../constants/theme';
import { GradientBackground } from '../../components/GradientBackground';
import { GlassPanel } from '../../components/GlassPanel';
import { HeatBadge } from '../../components/HeatBadge';
import { SourceBadge } from '../../components/SourceBadge';
import { CredibilityBar } from '../../components/CredibilityBar';
import { LeakCard } from '../../components/LeakCard';
import { useLeakStore } from '../../store/useLeakStore';
import { timeAgo, formatNumber } from '../../components/LeakCard';

const VERIFICATION_CONFIG = {
  confirmed: { label: '✓ Confirmed', color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  denied: { label: '✗ Denied', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  pending: { label: '⏳ Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};

export default function LeakDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const posts = useLeakStore(s => s.posts);
  const savedPosts = useLeakStore(s => s.savedPosts);
  const savedPostIds = useLeakStore(s => s.savedPostIds);
  const toggleSavePost = useLeakStore(s => s.toggleSavePost);
  const trackedGames = useLeakStore(s => s.trackedGames);
  const toggleTrackGame = useLeakStore(s => s.toggleTrackGame);

  const post = posts.find(p => p.id === id) || savedPosts.find(p => p.id === id);

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return posts
      .filter(p => p.id !== post.id && p.tags.some(t => post.tags.includes(t)))
      .slice(0, 3);
  }, [post, posts]);

  if (!post) {
    return (
      <GradientBackground>
        <View style={[styles.centered, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.errorIcon}>📭</Text>
          <Text style={styles.errorText}>Leak not found</Text>
          <Text style={styles.errorSubtext}>It may have been removed or expired</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  const isSaved = savedPostIds.has(post.id);
  const verification = VERIFICATION_CONFIG[post.verificationStatus];

  const handleOpenOriginal = () => Linking.openURL(post.url);
  const handleShare = async () => {
    try {
      await Share.share({ message: `${post.title}\n\n${post.url}`, title: post.title });
    } catch {}
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
            <Text style={[styles.saveText, isSaved && styles.savedText]}>
              {isSaved ? '★ Saved' : '☆ Save'}
            </Text>
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
        {/* Thumbnail */}
        {post.thumbnail && (
          <Image source={{ uri: post.thumbnail }} style={styles.heroImage} resizeMode="cover" />
        )}

        {/* Badges */}
        <View style={styles.badgesRow}>
          <HeatBadge heat={post.heat} />
          {post.flair && (
            <View style={styles.flairBadge}>
              <Text style={styles.flairText}>{post.flair}</Text>
            </View>
          )}
          <View style={[styles.verificationBadge, { backgroundColor: verification.bg }]}>
            <Text style={[styles.verificationText, { color: verification.color }]}>
              {verification.label}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{post.title}</Text>

        {/* Time */}
        <Text style={styles.timeText}>🕐 {formatDate(post.timestamp)} · {timeAgo(post.timestamp)}</Text>

        {/* Credibility */}
        <GlassPanel style={styles.credPanel}>
          <CredibilityBar score={post.credibility} />
        </GlassPanel>

        {/* Stats */}
        {(post.score > 0 || post.comments > 0) && (
          <View style={styles.statsRow}>
            {post.score > 0 && (
              <GlassPanel style={styles.statBox}>
                <Text style={styles.statValue}>▲ {formatNumber(post.score)}</Text>
                <Text style={styles.statLabel}>Upvotes</Text>
              </GlassPanel>
            )}
            {post.comments > 0 && (
              <GlassPanel style={styles.statBox}>
                <Text style={styles.statValue}>💬 {formatNumber(post.comments)}</Text>
                <Text style={styles.statLabel}>Comments</Text>
              </GlassPanel>
            )}
            <GlassPanel style={styles.statBox}>
              <Text style={styles.statValue}>📡 {post.sources.length}</Text>
              <Text style={styles.statLabel}>Sources</Text>
            </GlassPanel>
          </View>
        )}

        {/* Body */}
        {post.summary ? (
          <>
            <Text style={styles.sectionTitle}>Summary</Text>
            <GlassPanel style={styles.bodyPanel}>
              <Text style={styles.bodyText}>{post.summary}</Text>
            </GlassPanel>
          </>
        ) : null}

        {/* Tags + Track */}
        {post.tags.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsRow}>
              {post.tags.map(tag => {
                const isTracked = trackedGames.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagBadge, isTracked && styles.tagBadgeActive]}
                    onPress={() => toggleTrackGame(tag)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tagText, isTracked && styles.tagTextActive]}>
                      {isTracked ? '★' : '☆'} {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.tagHint}>Tap a tag to track the game</Text>
          </>
        )}

        {/* Sources */}
        <Text style={styles.sectionTitle}>Sources</Text>
        <GlassPanel style={styles.sourcesPanel}>
          <View style={styles.sourcesGrid}>
            {post.sources.map(source => (
              <SourceBadge key={source} source={source} />
            ))}
          </View>
        </GlassPanel>

        {/* Category */}
        <View style={styles.categoryRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{post.category}</Text>
          </View>
        </View>

        {/* Open original */}
        <TouchableOpacity style={styles.openButton} onPress={handleOpenOriginal} activeOpacity={0.85}>
          <Text style={styles.openButtonText}>Open Original Thread ↗</Text>
        </TouchableOpacity>

        {/* Related leaks */}
        {relatedPosts.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Related Leaks</Text>
            {relatedPosts.map(related => (
              <LeakCard key={related.id} post={related} />
            ))}
          </>
        )}
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
  headerButton: { paddingVertical: 8, paddingHorizontal: 12 },
  headerButtonText: { color: COLORS.accentCyan, fontSize: 15, fontWeight: FONT.semibold },
  headerActions: { flexDirection: 'row', gap: 4 },
  saveText: { color: COLORS.textMuted, fontSize: 15, fontWeight: FONT.semibold },
  savedText: { color: COLORS.accentGreen },
  content: { padding: 16 },
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.lg,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    backgroundColor: 'rgba(139,92,246,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  flairText: { color: '#c4b5fd', fontSize: 11, fontWeight: FONT.medium },
  verificationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  verificationText: { fontSize: 11, fontWeight: FONT.bold },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: FONT.heavy,
    lineHeight: 28,
    marginBottom: 8,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: FONT.medium,
    marginBottom: 16,
  },
  credPanel: { marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statValue: { color: COLORS.textPrimary, fontSize: 16, fontWeight: FONT.heavy },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: FONT.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  bodyPanel: { marginBottom: 16 },
  bodyText: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tagBadgeActive: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderColor: 'rgba(52,211,153,0.3)',
  },
  tagText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: FONT.medium },
  tagTextActive: { color: COLORS.accentGreen },
  tagHint: { color: COLORS.textMuted, fontSize: 11, marginBottom: 16, marginLeft: 2 },
  sourcesPanel: { marginBottom: 12 },
  sourcesGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  categoryRow: { flexDirection: 'row', marginBottom: 20 },
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(6,182,212,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.25)',
  },
  categoryText: { color: COLORS.accentCyan, fontSize: 13, fontWeight: FONT.semibold },
  openButton: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOW.card,
  },
  openButtonText: { color: COLORS.accentGreen, fontSize: 16, fontWeight: FONT.bold },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorText: { color: COLORS.textPrimary, fontSize: 20, fontWeight: FONT.bold, marginBottom: 6 },
  errorSubtext: { color: COLORS.textMuted, fontSize: 14, marginBottom: 20, textAlign: 'center' },
  backButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: RADIUS.pill, backgroundColor: 'rgba(6,182,212,0.12)', borderWidth: 1, borderColor: 'rgba(6,182,212,0.25)' },
  backButtonText: { color: COLORS.accentCyan, fontSize: 16, fontWeight: FONT.semibold },
});
