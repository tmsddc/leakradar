import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';

interface GlassPanelProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number; // kept for API compat, ignored
  noPadding?: boolean;
}

// Solid dark panel – replaces the blur glass effect with a clean card surface.
export function GlassPanel({ children, style, noPadding }: GlassPanelProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.content, noPadding && styles.noPadding]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
  },
  content: {
    padding: 16,
  },
  noPadding: {
    padding: 0,
  },
});
