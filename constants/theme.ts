// ─── LeakRadar Design System ────────────────────────────────────────────────
// Palette: deep black · refined blue · crisp white

export const COLORS = {
  // Backgrounds – higher contrast between layers
  background: '#07080f',
  surface:    '#0c0e1a',
  card:       '#111422',
  cardBorder: '#1d2136',

  // Accent – single refined blue
  accent:       '#4d74ff',
  accentDim:    'rgba(77,116,255,0.11)',
  accentBorder: 'rgba(77,116,255,0.24)',
  accentActive: 'rgba(77,116,255,0.16)',

  // Text hierarchy
  textPrimary:   '#eef1fa',
  textSecondary: '#7a8ba3',
  textMuted:     '#3e4f66',

  // Status / credibility
  green: '#22c55e',
  amber: '#f59e0b',
  red:   '#f43f5e',

  // Aliases kept for compat
  accentGreen:   '#22c55e',
  accentCyan:    '#4d74ff',
  glass:         'rgba(255,255,255,0.04)',
  glassBorder:   '#1d2136',
  glassHighlight:'rgba(255,255,255,0.05)',
  gradientOrb1:  '#07080f',
  gradientOrb2:  '#07080f',
  gradientOrb3:  '#07080f',

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
  sm:   5,
  md:   9,
  lg:   13,
  xl:   18,
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
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  nav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 14,
  },
};
