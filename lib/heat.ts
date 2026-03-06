export type HeatLevel = 'hot' | 'rising' | 'new';

export function calculateHeat(score: number, comments: number): HeatLevel {
  if (score > 500 || comments > 200) return 'hot';
  if (score > 100 || comments > 50) return 'rising';
  return 'new';
}

export const HEAT_CONFIG: Record<HeatLevel, { label: string; emoji: string; color: string }> = {
  hot: { label: 'Hot', emoji: '🔥', color: '#ef4444' },
  rising: { label: 'Rising', emoji: '📈', color: '#f59e0b' },
  new: { label: 'New', emoji: '🆕', color: '#3b82f6' },
};
