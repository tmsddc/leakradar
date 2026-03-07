// ─── LeakRadar Design System ─────────────────────────────────────────────────
// Palette: pure near-black · premium indigo-blue · crisp white

export const COLORS = {
  // Backgrounds – clear contrast between layers
  background: '#0a0a0f',
  surface:    '#111119',
  card:       '#18181f',
  cardBorder: '#26263a',

  // Accent – single indigo-blue (premium, modern)
  accent:       '#5b7cf2',
  accentDim:    'rgba(91,124,242,0.10)',
  accentBorder: 'rgba(91,124,242,0.26)',
  accentActive: 'rgba(91,124,242,0.15)',

  // Text
  textPrimary:   '#f4f5ff',
  textSecondary: '#8891a8',
  textMuted:     '#44506a',

  // Status
  green: '#22c55e',
  amber: '#f59e0b',
  red:   '#f43f5e',

  // Compat aliases
  accentGreen:    '#22c55e',
  accentCyan:     '#5b7cf2',
  glass:          'rgba(255,255,255,0.03)',
  glassBorder:    '#26263a',
  glassHighlight: 'rgba(255,255,255,0.04)',
  gradientOrb1:   '#0a0a0f',
  gradientOrb2:   '#0a0a0f',
  gradientOrb3:   '#0a0a0f',

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
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.40,
    shadowRadius: 12,
    elevation: 6,
  },
  nav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
  },
};
