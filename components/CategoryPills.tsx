import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, FONT } from '../constants/theme';
import { CATEGORIES, type Category } from '../constants/sources';
import { useLeakStore } from '../store/useLeakStore';

const CAT_ICONS: Record<Category, string> = {
  All:         'apps-outline',
  Hot:         'flame',
  PlayStation: 'game-controller-outline',
  Xbox:        'game-controller-outline',
  Nintendo:    'game-controller-outline',
  PC:          'desktop-outline',
  Multi:       'globe-outline',
};

// Distinct accent colors per category so they feel alive, not generic
const CAT_ACTIVE_COLOR: Record<Category, string> = {
  All:         COLORS.accent,
  Hot:         COLORS.red,
  PlayStation: '#2563eb',
  Xbox:        '#16a34a',
  Nintendo:    '#dc2626',
  PC:          '#7c3aed',
  Multi:       COLORS.accent,
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
    paddingHorizontal: 16,
    paddingVertical: 6,
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
    gap: 5,
    paddingHorizontal: 13,
    height: 32,
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    flexShrink: 0,
  },
  pillText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: FONT.medium,
    includeFontPadding: false,
  },
});
