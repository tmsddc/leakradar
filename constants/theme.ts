export const COLORS = {
  background: '#0e0e1a',
  surface: 'rgba(255, 255, 255, 0.06)',
  surfaceHover: 'rgba(255, 255, 255, 0.10)',
  glass: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassHighlight: 'rgba(255, 255, 255, 0.14)',
  accentGreen: '#34d399',
  accentCyan: '#06b6d4',
  accentGradient: ['#34d399', '#06b6d4'] as const,
  textPrimary: 'rgba(255, 255, 255, 1.0)',
  textSecondary: 'rgba(255, 255, 255, 0.55)',
  textMuted: 'rgba(255, 255, 255, 0.30)',
  hotRed: '#ef4444',
  risingOrange: '#f59e0b',
  newBlue: '#3b82f6',
  white: '#ffffff',
  black: '#000000',
  // Light mode
  lightBackground: '#f2f2f7',
  lightSurface: 'rgba(0, 0, 0, 0.04)',
  lightGlass: 'rgba(255, 255, 255, 0.70)',
  lightGlassBorder: 'rgba(0, 0, 0, 0.08)',
  lightTextPrimary: 'rgba(0, 0, 0, 0.88)',
  lightTextSecondary: 'rgba(0, 0, 0, 0.50)',
  lightTextMuted: 'rgba(0, 0, 0, 0.25)',
  // Gradient orbs for mesh background
  gradientOrb1: '#4338ca', // indigo
  gradientOrb2: '#7c3aed', // violet
  gradientOrb3: '#06b6d4', // cyan
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 100,
  card: 20,
};

export const FONT = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
  black: '900' as const,
};

export const SHADOW = {
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  nav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
};
