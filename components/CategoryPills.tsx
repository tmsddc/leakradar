import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, FlatList, View } from 'react-native';
import { COLORS, RADIUS, FONT } from '../constants/theme';
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

const CATS = [...CATEGORIES];

export function CategoryPills() {
  const activeCategory = useLeakStore(s => s.activeCategory);
  const setActiveCategory = useLeakStore(s => s.setActiveCategory);

  const renderItem = useCallback(({ item: cat }: { item: Category }) => {
    const isActive = activeCategory === cat;
    return (
      <TouchableOpacity
        style={[styles.pill, isActive && styles.pillActive]}
        onPress={() => setActiveCategory(cat)}
        activeOpacity={0.7}
      >
        <View style={styles.pillInner}>
          <Text style={styles.pillEmoji} numberOfLines={1}>
            {CATEGORY_EMOJIS[cat] ?? '🎮'}
          </Text>
          <Text
            style={[styles.pillText, isActive && styles.pillTextActive]}
            numberOfLines={1}
          >
            {cat}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [activeCategory, setActiveCategory]);

  return (
    <FlatList
      data={CATS}
      keyExtractor={(item) => item}
      renderItem={renderItem}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      extraData={activeCategory}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
    borderColor: 'rgba(52, 211, 153, 0.5)',
  },
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillEmoji: {
    fontSize: 13,
    marginRight: 5,
    color: '#ffffff',
  },
  pillText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#34d399',
  },
});
