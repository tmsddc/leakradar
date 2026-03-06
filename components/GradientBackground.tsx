import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

export function GradientBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      <View style={styles.background}>
        {/* Gradient orbs */}
        <View style={[styles.orb, styles.orb1]} />
        <View style={[styles.orb, styles.orb2]} />
        <View style={[styles.orb, styles.orb3]} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 300,
    height: 300,
    top: -50,
    left: -80,
    backgroundColor: COLORS.gradientOrb1,
    opacity: 0.15,
    transform: [{ scale: 1.5 }],
  },
  orb2: {
    width: 250,
    height: 250,
    top: '40%',
    right: -60,
    backgroundColor: COLORS.gradientOrb2,
    opacity: 0.12,
    transform: [{ scale: 1.3 }],
  },
  orb3: {
    width: 200,
    height: 200,
    bottom: '10%',
    left: '20%',
    backgroundColor: COLORS.gradientOrb3,
    opacity: 0.10,
    transform: [{ scale: 1.4 }],
  },
});
