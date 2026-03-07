import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, FONT } from '../constants/theme';
import { CATEGORIES, type Category } from '../constants/sources';
import { useLeakStore } from '../store/useLeakStore';

const CAT_ICONS: Record<Category, string> = {
  All:         'apps-outline',
  PlayStation: 'game-controller-outline',
  Xbox:        'game-controller-outline',
  Nintendo:    'game-controller-outline',
  PC:          'desktop-outline',
};

// Distinct neon accent per category
const CAT_ACTIVE_COLOR: Record<Category, string> = {
  All:         COLORS.accent,
  PlayStation: COLORS.catPlayStation,
  Xbox:        COLORS.catXbox,
  Nintendo:    COLORS.catNintendo,
  PC:          COLORS.catPC,
};

export function CategoryPills() {
  const activeCategory = useLeakStore(s => s.activeCategory);
  const setActiveCategory = useLeakStore(s => s.setActiveCategory);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      nestedScrollEnabled
    >
      <View style={styles.row}>
        {CATEGORIES.map((cat: Category) => {
          const isActive = activeCategory === cat;
          const color = CAT_ACTIVE_COLOR[cat];
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.pill,
                isActive && { backgroundColor: `${color}18`, borderColor: `${color}40` },
              ]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={CAT_ICONS[cat] as any}
                size={12}
                color={isActive ? color : COLORS.textMuted}
              />
              <Text
                style={[styles.pillText, isActive && { color, fontWeight: FONT.bold }]}
                allowFontScaling={false}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    height: 28,
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    flexShrink: 0,
  },
  pillText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: FONT.medium,
    includeFontPadding: false,
  },
});
