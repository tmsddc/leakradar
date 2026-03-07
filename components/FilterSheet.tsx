import React, { useEffect, useRef, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  Animated, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS } from '../constants/theme';
import { useLeakStore } from '../store/useLeakStore';
import type { PostTypeFilter } from '../store/useLeakStore';

const TYPE_OPTIONS: { label: string; value: PostTypeFilter; color: string; icon: string }[] = [
  { label: 'All',     value: 'all',    color: COLORS.accent,      icon: 'apps-outline'                },
  { label: 'Leaks',   value: 'leak',   color: COLORS.neonRed,     icon: 'warning-outline'             },
  { label: 'Rumours', value: 'rumour', color: COLORS.neonOrange,  icon: 'chatbubble-ellipses-outline' },
  { label: 'News',    value: 'news',   color: COLORS.neonBlue,    icon: 'newspaper-outline'           },
];

const CRED_OPTIONS: { label: string; sub: string; value: number; color: string }[] = [
  { label: 'Any',  sub: 'Show everything', value: 0,  color: COLORS.textSecondary },
  { label: '60%+', sub: 'Fairly credible', value: 60, color: COLORS.amber          },
  { label: '80%+', sub: 'Highly credible', value: 80, color: COLORS.neonGreen      },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function FilterSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { postTypeFilter, setPostTypeFilter, minCredibility, setMinCredibility } = useLeakStore();
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220, mass: 0.8 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 500, duration: 240, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  const activeFilters = (postTypeFilter !== 'all' ? 1 : 0) + (minCredibility > 0 ? 1 : 0);

  const handleReset = () => {
    setPostTypeFilter('all');
    setMinCredibility(0);
  };

  if (!mounted && !visible) return null;

  return (
    <Modal transparent animationType="none" visible={mounted} onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 16 },
        ]}
      >
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Filters</Text>
          {activeFilters > 0 ? (
            <TouchableOpacity onPress={handleReset} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.resetText}>Reset all</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Content Type */}
        <Text style={styles.sectionLabel}>Content Type</Text>
        <View style={styles.typeGrid}>
          {TYPE_OPTIONS.map(opt => {
            const active = postTypeFilter === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.typeBtn,
                  active && { borderColor: opt.color, backgroundColor: `${opt.color}16` },
                ]}
                onPress={() => setPostTypeFilter(opt.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={16}
                  color={active ? opt.color : COLORS.textMuted}
                />
                <Text style={[styles.typeBtnText, active && { color: opt.color, fontWeight: FONT.bold }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Credibility */}
        <Text style={styles.sectionLabel}>Minimum Credibility</Text>
        <View style={styles.credRow}>
          {CRED_OPTIONS.map(opt => {
            const active = minCredibility === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.credBtn,
                  active && { borderColor: `${opt.color}44`, backgroundColor: `${opt.color}14` },
                ]}
                onPress={() => setMinCredibility(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.credBtnLabel, active && { color: opt.color }]}>
                  {opt.label}
                </Text>
                <Text style={[styles.credBtnSub, active && { color: opt.color, opacity: 0.7 }]}>
                  {opt.sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Done */}
        <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.82}>
          <Text style={styles.doneBtnText}>
            {activeFilters > 0 ? `Apply ${activeFilters} filter${activeFilters > 1 ? 's' : ''}` : 'Done'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.80)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  handle: {
    width: 30,
    height: 3,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  sheetTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: FONT.bold,
    letterSpacing: -0.4,
  },
  resetText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: FONT.semibold,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: FONT.heavy,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
    gap: 6,
  },
  typeBtnText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONT.semibold,
  },
  credRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  credBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    gap: 3,
  },
  credBtnActive: {
    borderColor: COLORS.accentBorder,
    backgroundColor: COLORS.accentDim,
  },
  credBtnLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: FONT.bold,
  },
  credBtnLabelActive: {
    color: COLORS.accent,
  },
  credBtnSub: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: FONT.medium,
    textAlign: 'center',
  },
  doneBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  doneBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: FONT.bold,
    letterSpacing: 0.1,
  },
});
