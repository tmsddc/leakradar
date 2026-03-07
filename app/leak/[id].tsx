import React, { useMemo, useRef } from 'react';
import {
  Animated, Image, Linking, ScrollView,
  Share, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW, TOKENS } from '../../constants/theme';
import { GradientBackground } from '../../components/GradientBackground';
import { SourceBadge } from '../../components/SourceBadge';
import { LeakCard } from '../../components/LeakCard';
import { CredibilityRing, CredibilityBar } from '../../components/CredibilityRing';
import { useLeakStore } from '../../store/useLeakStore';
import { timeAgo, formatNumber } from '../../components/LeakCard';

const HERO_HEIGHT = 300;
const HEADER_HEIGHT = 54;

export default function LeakDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const posts           = useLeakStore(s => s.posts);
  const savedPosts      = useLeakStore(s => s.savedPosts);
  const savedPostIds    = useLeakStore(s => s.savedPostIds);
  const toggleSavePost  = useLeakStore(s => s.toggleSavePost);
  const trackedGames    = useLeakStore(s => s.trackedGames);
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
          <Ionicons name="alert-circle-outline" size={40} color={COLORS.textMuted} />
          <Text style={styles.errorTitle}>Leak not found</Text>
          <Text style={styles.errorSub}>It may have been removed or expired</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  const isSaved    = savedPostIds.has(post.id);
  const typeConfig = TOKENS.postType[post.postType] ?? TOKENS.postType.news;
  const verifConfig = TOKENS.verification[post.verificationStatus];
  const heatConfig  = TOKENS.heat[post.heat];

  // Parallax: image translates up as user scrolls
  const imageTranslate = scrollY.interpolate({
    inputRange: [-HERO_HEIGHT, 0, HERO_HEIGHT],
    outputRange: [-HERO_HEIGHT / 3, 0, HERO_HEIGHT * 0.4],
    extrapolate: 'clamp',
  });

  // Header background fades in after scrolling past hero
  const headerBg = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 80, HERO_HEIGHT - 20],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleOpenOriginal = () => Linking.openURL(post.url);
  const handleShare = async () => {
    try {
      await Share.share({ message: `${post.title}\n\n${post.url}`, title: post.title });
    } catch {}
  };

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  return (
    <GradientBackground>
      {/* ── Floating transparent header ──────────────────────────────────── */}
      <Animated.View
        style={[
          styles.floatingHeader,
          { paddingTop: insets.top },
          { backgroundColor: headerBg.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.95)'] }) },
        ]}
      >
        <View style={[styles.headerRow, { height: HEADER_HEIGHT }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => toggleSavePost(post)} style={styles.headerBtn}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isSaved ? COLORS.accent : COLORS.white}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
              <Ionicons name="share-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        {/* ── Hero image — parallax ──────────────────────────────────────── */}
        <View style={styles.heroContainer}>
          {post.thumbnail ? (
            <Animated.View style={[styles.heroImageWrap, { transform: [{ translateY: imageTranslate }] }]}>
              <Image source={{ uri: post.thumbnail }} style={styles.heroImage} resizeMode="cover" />
            </Animated.View>
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="radio-outline" size={48} color={COLORS.textMuted} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.2)', COLORS.background]}
            locations={[0.4, 0.7, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {/* Type + heat badge over image */}
          <View style={styles.heroBadges}>
            <View style={[styles.typePill, { backgroundColor: `${typeConfig.color}cc`, borderColor: typeConfig.color }]}>
              <Text style={[styles.typePillText, { color: '#fff' }]}>{typeConfig.label}</Text>
            </View>
            <View style={[styles.typePill, { backgroundColor: `${heatConfig.color}cc`, borderColor: heatConfig.color }]}>
              <Text style={[styles.typePillText, { color: '#fff' }]}>{heatConfig.label}</Text>
            </View>
          </View>
        </View>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        <View style={styles.content}>
          {/* Verification banner */}
          <View style={[styles.verifBanner, { backgroundColor: `${verifConfig.color}12`, borderColor: `${verifConfig.color}28` }]}>
            <View style={[styles.verifDot, { backgroundColor: verifConfig.color }]} />
            <Text style={[styles.verifLabel, { color: verifConfig.color }]}>{verifConfig.label}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{post.title}</Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <Text style={styles.dateText}>{formatDate(post.timestamp)}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.dateText}>{timeAgo(post.timestamp)}</Text>
            {post.score > 0 && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Ionicons name="arrow-up" size={11} color={COLORS.textMuted} />
                <Text style={styles.dateText}>{formatNumber(post.score)}</Text>
              </>
            )}
            {post.comments > 0 && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Ionicons name="chatbubble-outline" size={11} color={COLORS.textMuted} />
                <Text style={styles.dateText}>{formatNumber(post.comments)}</Text>
              </>
            )}
          </View>

          {/* ── Credibility panel ─────────────────────────────────────────── */}
          <View style={styles.credPanel}>
            <CredibilityBar score={post.credibility} showLabel />
          </View>

          {/* Stats strip */}
          {(post.score > 0 || post.comments > 0 || post.sources.length > 0) && (
            <View style={styles.statsStrip}>
              {post.score > 0 && (
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{formatNumber(post.score)}</Text>
                  <Text style={styles.statLabel}>Upvotes</Text>
                </View>
              )}
              {post.comments > 0 && (
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{formatNumber(post.comments)}</Text>
                  <Text style={styles.statLabel}>Comments</Text>
                </View>
              )}
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{post.sources.length}</Text>
                <Text style={styles.statLabel}>Sources</Text>
              </View>
            </View>
          )}

          {/* Summary */}
          {post.summary && (
            <View style={styles.section}>
              <SectionTitle>Summary</SectionTitle>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>{post.summary}</Text>
              </View>
            </View>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <View style={styles.section}>
              <SectionTitle>Game Intel</SectionTitle>
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
                      {isTracked && <Ionicons name="bookmark" size={11} color={COLORS.accent} />}
                      <Text style={[styles.tagText, isTracked && styles.tagTextActive]}>{tag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.tagHint}>Tap a game to track it</Text>
            </View>
          )}

          {/* Sources */}
          <View style={styles.section}>
            <SectionTitle>Sources</SectionTitle>
            <View style={styles.sourcesGrid}>
              {post.sources.map(source => (
                <SourceBadge key={source} source={source} />
              ))}
            </View>
          </View>

          {/* Open original CTA */}
          <TouchableOpacity style={styles.openBtn} onPress={handleOpenOriginal} activeOpacity={0.85}>
            <Ionicons name="open-outline" size={17} color={COLORS.white} />
            <Text style={styles.openBtnText}>Open Original Thread</Text>
          </TouchableOpacity>

          {/* ── Related leaks ─────────────────────────────────────────────── */}
          {relatedPosts.length > 0 && (
            <View style={[styles.section, { paddingTop: 8 }]}>
              <SectionTitle>Related Leaks</SectionTitle>
              {relatedPosts.map(related => (
                <LeakCard key={related.id} post={related} />
              ))}
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </GradientBackground>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text style={sectionTitleStyle}>{children}</Text>
  );
}
const sectionTitleStyle: any = {
  color: COLORS.textMuted,
  fontSize: 9,
  fontWeight: FONT.heavy,
  textTransform: 'uppercase',
  letterSpacing: 1.5,
  marginBottom: 10,
};

const styles = StyleSheet.create({
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: { flexDirection: 'row', gap: 6 },

  heroContainer: {
    height: HERO_HEIGHT,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  heroImageWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: '100%',
    height: HERO_HEIGHT + 60, // extra for parallax range
  },
  heroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  heroBadges: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: FONT.heavy,
    letterSpacing: 0.8,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  verifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  verifDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  verifLabel: {
    fontSize: 11,
    fontWeight: FONT.heavy,
    letterSpacing: 0.8,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: FONT.heavy,
    lineHeight: 29,
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  dateText: { color: COLORS.textMuted, fontSize: 12 },
  metaDot: { color: COLORS.textMuted, fontSize: 12 },

  credPanel: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
    ...SHADOW.card,
  },

  statsStrip: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 3,
  },
  statValue: { color: COLORS.textPrimary, fontSize: 18, fontWeight: FONT.heavy },
  statLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: FONT.heavy, letterSpacing: 0.8, textTransform: 'uppercase' },

  section: { gap: 10 },
  summaryBox: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 14,
  },
  summaryText: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 23 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tagBadgeActive: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accentBorder,
  },
  tagText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: FONT.medium },
  tagTextActive: { color: COLORS.accent },
  tagHint: { color: COLORS.textMuted, fontSize: 11 },

  sourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 12,
  },

  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingVertical: 15,
  },
  openBtnText: { color: COLORS.white, fontSize: 15, fontWeight: FONT.bold, letterSpacing: 0.2 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: FONT.bold, marginTop: 12, marginBottom: 6 },
  errorSub: { color: COLORS.textMuted, fontSize: 14, marginBottom: 24, textAlign: 'center' },
  backButton: {
    paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1, borderColor: COLORS.accentBorder,
  },
  backButtonText: { color: COLORS.accent, fontSize: 15, fontWeight: FONT.semibold },
});
