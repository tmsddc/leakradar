import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { COLORS, RADIUS, FONT } from '../constants/theme';
import { CATEGORIES, type Category } from '../constants/sources';
import { useLeakStore } from '../store/useLeakStore';

// Render pills exactly like SortPicker (plain View children) – this avoids
// the Android bug where Text inside horizontal FlatList/ScrollView renders
// invisible. We use a horizontal ScrollView only as the outermost wrapper,
// with a plain View inside so Text components render in the same layout path
// as the working SortPicker component.
export function CategoryPills() {
  const activeCategory = useLeakStore(s => s.activeCategory);
  const setActiveCategory = useLeakStore(s => s.setActiveCategory);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      // Prevent nested scroll conflicts
      nestedScrollEnabled
    >
      {/* Inner View so Text renders in a plain View stacking context */}
      <View style={styles.row}>
        {CATEGORIES.map((cat: Category) => {
          const isActive = activeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.pillText, isActive && styles.pillTextActive]}
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
    minHeight: 50,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 38,
  },
  pill: {
    paddingHorizontal: 16,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pillActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
    borderColor: 'rgba(52, 211, 153, 0.5)',
  },
  pillText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    includeFontPadding: false,
  },
  pillTextActive: {
    color: '#34d399',
    fontWeight: '700',
  },
});
