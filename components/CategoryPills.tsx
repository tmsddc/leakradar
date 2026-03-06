import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView, View } from 'react-native';
import { COLORS, RADIUS, FONT, SPACING } from '../constants/theme';
import { CATEGORIES, type Category } from '../constants/sources';
import { useLeakStore } from '../store/useLeakStore';

const CATEGORY_EMOJIS: Record<string, string> = {
  All: '🎮',
  Hot: '🔥',
  PlayStation: '🔵',
  Xbox: '🟢',
  Nintendo: '🔴',
  PC: '🖥️',
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
      {CATEGORIES.map(cat => (
        <TouchableOpacity
          key={cat}
          style={[styles.pill, activeCategory === cat && styles.pillActive]}
          onPress={() => setActiveCategory(cat)}
          activeOpacity={0.7}
        >
          <Text style={[styles.pillText, activeCategory === cat && styles.pillTextActive]}>
            {CATEGORY_EMOJIS[cat]} {cat}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  pillText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: FONT.semibold,
  },
  pillTextActive: {
    color: COLORS.accentGreen,
  },
});
