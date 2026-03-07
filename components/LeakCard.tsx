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

interface LeakCardProps {
  post: LeakPost;
  hero?: boolean;   // first card in feed — edge-to-edge hero treatment
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

export const LeakCard = memo(function LeakCard({ post, hero = false }: LeakCardProps) {
  const router = useRouter();
  const swipeableRef = useRef<Swipeable>(null);
  const savedPostIds = useLeakStore(s => s.savedPostIds);
  const toggleSavePost = useLeakStore(s => s.toggleSavePost);
  const isSaved = savedPostIds.has(post.id);
  const [thumbError, setThumbError] = useState(false);
  const hasImage = post.thumbnail && !thumbError;
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

  // ── Hero card: full-bleed image, title embedded in gradient ─────────────────
  if (hero && hasImage) {
    return (
      <Swipeable
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        onSwipeableOpen={(dir) => { if (dir === 'right') handleSwipeSave(); }}
        friction={2} leftThreshold={40} overshootLeft={false}
      >
        <TouchableOpacity style={styles.heroCard} onPress={handlePress} activeOpacity={0.88}>
          <Image
            source={{ uri: post.thumbnail }}
            style={styles.heroImage}
            resizeMode="cover"
            onError={() => setThumbError(true)}
          />
          {/* Full gradient overlay — dark at bottom for title legibility */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.92)']}
            locations={[0.2, 0.5, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {/* Top strip: badges */}
          <View style={styles.heroBadgesRow}>
            {isBreaking && (
              <View style={styles.breakingPill}>
                <Animated.View style={[styles.breakingDot, { opacity: pulseAnim }]} />
                <Text style={styles.breakingText}>BREAKING</Text>
              </View>
            )}
            <TypeBadge config={typeConfig} />
            {verifConfig && <StatusBadge config={verifConfig} />}
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => toggleSavePost(post)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color={isSaved ? COLORS.accent : 'rgba(255,255,255,0.7)'} />
            </TouchableOpacity>
          </View>
          {/* Bottom: title + meta */}
          <View style={styles.heroBottom}>
            {post.tags.length > 0 && (
              <View style={styles.heroTags}>
                {post.tags.slice(0, 2).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={styles.heroTag}
                    onPress={() => router.push({ pathname: '/game/[name]', params: { name: t } })}
                  >
                    <Text style={styles.heroTagText}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={styles.heroTitle} numberOfLines={3}>{post.title}</Text>
            <View style={styles.heroMeta}>
              <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.5)" />
              <Text style={styles.heroTime}>{timeAgo(post.timestamp)}</Text>
              {post.sources.length > 1 && (
                <Text style={styles.heroSources}>· {post.sources.length} sources</Text>
              )}
              <View style={{ flex: 1 }} />
              <CredibilityRing score={post.credibility} size={36} strokeWidth={3} />
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  }

  // ── Standard card ──────────────────────────────────────────────────────────
  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      onSwipeableOpen={(dir) => { if (dir === 'right') handleSwipeSave(); }}
      friction={2} leftThreshold={40} overshootLeft={false}
    >
      <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.86}>
        {/* Breaking banner */}
        {isBreaking && !hasImage && (
          <View style={styles.breakingBanner}>
            <Animated.View style={[styles.breakingDotDark, { opacity: pulseAnim }]} />
            <Text style={styles.breakingTextDark}>BREAKING</Text>
          </View>
        )}

        {/* Thumbnail — right-aligned for asymmetry when present */}
        <View style={styles.cardInner}>
          <View style={styles.cardLeft}>
            {/* Badge row */}
            <View style={styles.badgesRow}>
              <HeatBadge config={heatConfig} />
              <TypeBadge config={typeConfig} />
              {verifConfig && <StatusBadge config={verifConfig} />}
            </View>

            {/* Title */}
            <Text style={styles.title} numberOfLines={hasImage ? 2 : 3}>
              {post.title}
            </Text>

            {/* Summary */}
            {post.summary && !hasImage ? (
              <Text style={styles.summary} numberOfLines={2}>{post.summary}</Text>
            ) : null}

            {/* Tags */}
            {post.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {post.tags.slice(0, 3).map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.tagChip}
                    onPress={() => router.push({ pathname: '/game/[name]', params: { name: tag } })}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Thumbnail column */}
          {hasImage && (
            <View style={styles.thumbWrap}>
              <Image
                source={{ uri: post.thumbnail }}
                style={styles.thumbnail}
                resizeMode="cover"
                onError={() => setThumbError(true)}
              />
              {isBreaking && (
                <View style={styles.thumbBreaking}>
                  <Animated.View style={[styles.breakingDot, { opacity: pulseAnim }]} />
                </View>
              )}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <CredibilityRing score={post.credibility} compact />
          <View style={styles.footerRight}>
            <Text style={styles.timeText}>{timeAgo(post.timestamp)}</Text>
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
            <TouchableOpacity
              onPress={() => toggleSavePost(post)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={15}
                color={isSaved ? COLORS.accent : COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
});

// ── Sub-components ─────────────────────────────────────────────────────────────
function TypeBadge({ config }: { config: { color: string; label: string } }) {
  return (
    <View style={[badge.wrap, { borderColor: `${config.color}35`, backgroundColor: `${config.color}14` }]}>
      <View style={[badge.dot, { backgroundColor: config.color }]} />
      <Text style={[badge.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function StatusBadge({ config }: { config: { color: string; label: string } }) {
  return (
    <View style={[badge.wrap, { borderColor: `${config.color}35`, backgroundColor: `${config.color}14` }]}>
      <Text style={[badge.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function HeatBadge({ config }: { config: { color: string; label: string } }) {
  return (
    <View style={[badge.wrap, { borderColor: `${config.color}35`, backgroundColor: `${config.color}14` }]}>
      <Text style={[badge.text, { color: config.color }]}>{config.label}</Text>
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
  // ── Hero card ───────────────────────────────────────────────────────────────
  heroCard: {
    marginHorizontal: 0,
    marginBottom: 2,
    height: 300,
    overflow: 'hidden',
    ...SHADOW.glass,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroBadgesRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 8,
  },
  heroTags: {
    flexDirection: 'row',
    gap: 6,
  },
  heroTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    backgroundColor: 'rgba(124,58,237,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
  },
  heroTagText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: FONT.bold,
    letterSpacing: 0.3,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: FONT.heavy,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: FONT.medium,
  },
  heroSources: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },

  // ── Standard card ────────────────────────────────────────────────────────────
  card: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  cardInner: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
  },
  cardLeft: {
    flex: 1,
    gap: 8,
  },
  thumbWrap: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    flexShrink: 0,
    alignSelf: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbBreaking: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.neonRed,
  },
  breakingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: `${COLORS.neonRed}10`,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.neonRed}22`,
  },
  breakingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: `${COLORS.neonRed}dd`,
  },
  breakingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  breakingText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: FONT.heavy,
    letterSpacing: 1.2,
  },
  breakingDotDark: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.neonRed,
  },
  breakingTextDark: {
    color: COLORS.neonRed,
    fontSize: 9,
    fontWeight: FONT.heavy,
    letterSpacing: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
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
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONT.medium,
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
  swipeAction: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.card,
    marginBottom: 8,
    marginLeft: 12,
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
