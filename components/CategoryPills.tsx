import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView, View } from 'react-native';
import { COLORS, RADIUS, FONT, SPACING } from '../constants/theme';
import { CATEGORIES, type Category } from '../constants/sources';
import { useLeakStore } from '../store/useLeakStore';

const CATEGORY_EMOJIS: Record<string, string> = {
  All: '🎮',
  Hot: '🔥',
  PlayStation: '🎮',
  Xbox: '🟢',
  Nintendo: '🔴',
  PC: '💻',
  Multi: '🌐',
};

export function CategoryPills() {
  const activeCategory = useLeakStore(s => s.activeCategory);
  const setActiveCategory = useLeakStore(s => s.setActiveCategory);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map(cat => {
        const isActive = activeCategory === cat;
        return (
          <TouchableOpacity
            key={cat}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => setActiveCategory(cat)}
            activeOpacity={0.7}
          >
            <Text style={styles.pillEmoji}>{CATEGORY_EMOJIS[cat] ?? '🎮'}</Text>
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{cat}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginRight: 8,
    flexShrink: 0,
  },
  pillActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
    borderColor: 'rgba(52, 211, 153, 0.5)',
  },
  pillEmoji: {
    fontSize: 12,
    marginRight: 5,
  },
  pillText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: FONT.semibold,
  },
  pillTextActive: {
    color: COLORS.accentGreen,
  },
});
