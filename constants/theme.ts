// ─── LeakRadar Design System ─────────────────────────────────────────────────
// Palette: deep violet-black · electric violet · near-white

export const COLORS = {
  // Backgrounds — layered dark with subtle violet undertone
  background: '#09090f',
  surface:    '#0f0e19',
  card:       '#161523',
  cardBorder: '#252240',

  // Accent — electric violet (distinct from every other app's blue)
  accent:       '#8b5cf6',
  accentDim:    'rgba(139,92,246,0.11)',
  accentBorder: 'rgba(139,92,246,0.30)',
  accentActive: 'rgba(139,92,246,0.18)',

  // Text — slight violet tint keeps it cohesive
  textPrimary:   '#f0f0ff',
  textSecondary: '#8a88a8',
  textMuted:     '#454462',

  // Status colors
  green: '#22c55e',
  amber: '#f59e0b',
  red:   '#f43f5e',

  // Compat aliases (used across components)
  accentGreen:    '#22c55e',
  accentCyan:     '#8b5cf6',
  glass:          'rgba(255,255,255,0.025)',
  glassBorder:    '#252240',
  glassHighlight: 'rgba(255,255,255,0.04)',
  gradientOrb1:   '#09090f',
  gradientOrb2:   '#09090f',
  gradientOrb3:   '#09090f',

  white: '#ffffff',
  black: '#000000',
};

export const SPACING = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
};

export const RADIUS = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  pill: 100,
  card: 16,
};

export const FONT = {
  light:    '300' as const,
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
  heavy:    '800' as const,
  black:    '900' as const,
};

export const SHADOW = {
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  nav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 16,
  },
};
