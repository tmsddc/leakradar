// ─── LeakRadar Design System v2 ───────────────────────────────────────────────
// OLED-first · Neon accents · Premium gaming aesthetic

export const COLORS = {
  // ── Backgrounds — true OLED black layered ──────────────────────────────────
  background: '#000000',      // OLED true black
  surface:    '#0c0c0e',      // cards background layer
  card:       '#111116',      // slightly blue-black tint for depth
  cardBorder: '#1e1e28',      // subtle border — barely visible

  // ── Primary accent — electric violet ───────────────────────────────────────
  accent:       '#7c3aed',
  accentBright: '#9333ea',
  accentDim:    'rgba(124,58,237,0.12)',
  accentBorder: 'rgba(124,58,237,0.28)',
  accentActive: 'rgba(124,58,237,0.20)',

  // ── Neon status colors ─────────────────────────────────────────────────────
  neonGreen:  '#00ff88',   // toxic green  — Confirmed
  neonBlue:   '#00b4ff',   // electric blue — News
  neonOrange: '#ff6600',   // molten orange — Hot Rumour / HOT badge
  neonRed:    '#ff2d55',   // neon red-pink — LEAK badge / Denied
  neonPurple: '#bf5af2',   // vivid purple  — Rising

  // ── Legacy status (credibility scale — green→amber→orange→red) ───────────
  green: '#00ff88',
  amber: '#ffcc00',
  red:   '#ff2d55',

  // ── Text — slight cold tint for gaming feel ────────────────────────────────
  textPrimary:   '#f0f0ff',
  textSecondary: '#8888aa',
  textMuted:     '#3d3d55',

  // ── Platform category colors ───────────────────────────────────────────────
  catPlayStation: '#0070f3',   // PlayStation blue
  catXbox:        '#107c10',   // Xbox green
  catNintendo:    '#e4000f',   // Nintendo red
  catPC:          '#bf5af2',   // PC purple
  catAll:         '#7c3aed',

  // ── Glassmorphism ──────────────────────────────────────────────────────────
  glass:          'rgba(255,255,255,0.03)',
  glassBorder:    'rgba(255,255,255,0.07)',
  glassHighlight: 'rgba(255,255,255,0.05)',

  // ── Misc ───────────────────────────────────────────────────────────────────
  white: '#ffffff',
  black: '#000000',

  // Compat aliases
  accentGreen:  '#00ff88',
  accentCyan:   '#00b4ff',
  gradientOrb1: '#000000',
  gradientOrb2: '#000000',
  gradientOrb3: '#000000',
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
  xs:   4,
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  pill: 100,
  card: 12,     // Sharper cards — less rounding than before
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
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  nav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 20,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  }),
};

// ── Design Tokens — semantic mapping ──────────────────────────────────────────
export const TOKENS = {
  postType: {
    leak:   { color: COLORS.neonRed,    label: 'LEAK'   },
    rumour: { color: COLORS.neonOrange, label: 'RUMOUR' },
    news:   { color: COLORS.neonBlue,   label: 'NEWS'   },
  },
  verification: {
    confirmed: { color: COLORS.neonGreen,  label: 'CONFIRMED' },
    denied:    { color: COLORS.neonRed,    label: 'DENIED'    },
    pending:   { color: COLORS.amber,      label: 'PENDING'   },
  },
  heat: {
    hot:    { color: COLORS.neonOrange, label: 'HOT'    },
    rising: { color: COLORS.neonPurple, label: 'RISING' },
    new:    { color: COLORS.neonBlue,   label: 'NEW'    },
  },
  credibility: (score: number): string => {
    if (score >= 80) return COLORS.neonGreen;
    if (score >= 60) return COLORS.amber;
    if (score >= 40) return COLORS.neonOrange;
    return COLORS.neonRed;
  },
};
