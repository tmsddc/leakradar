import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';

interface GlassPanelProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  noPadding?: boolean;
}

export function GlassPanel({ children, style, intensity = 40, noPadding }: GlassPanelProps) {
  return (
    <View style={[styles.container, SHADOW.card, style]}>
      <BlurView intensity={intensity} tint="dark" style={styles.blur}>
        {/* Top highlight */}
        <View style={styles.highlight} />
        <View style={[styles.content, noPadding && { padding: 0 }]}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  blur: {
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.glassHighlight,
  },
  content: {
    padding: 16,
    backgroundColor: COLORS.glass,
  },
});
