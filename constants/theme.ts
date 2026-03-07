// ─── LeakRadar Design System ────────────────────────────────────────────────
// Palette: near-black · electric blue · soft white
// No gradients, no glass blur, no emojis – clean typographic UI

export const COLORS = {
  // Backgrounds
  background: '#080c14',
  surface: '#0c1220',
  card: '#0f1728',
  cardBorder: '#1b2744',

  // Accent (blue only – single primary accent colour)
  accent: '#3d85f5',
  accentDim: 'rgba(61,133,245,0.12)',
  accentBorder: 'rgba(61,133,245,0.28)',
  accentActive: 'rgba(61,133,245,0.18)',

  // Text hierarchy
  textPrimary: '#eef2f7',
  textSecondary: '#8496ac',
  textMuted: '#47596e',

  // Status / credibility
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#f43f5e',

  // Aliases used by older components (kept for compat)
  accentGreen: '#22c55e',
  accentCyan: '#3d85f5',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: '#1b2744',
  glassHighlight: 'rgba(255,255,255,0.05)',
  gradientOrb1: '#080c14',
  gradientOrb2: '#080c14',
  gradientOrb3: '#080c14',

  white: '#ffffff',
  black: '#000000',
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
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 100,
  card: 14,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  nav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
};
