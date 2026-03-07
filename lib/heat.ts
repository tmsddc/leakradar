export type HeatLevel = 'hot' | 'rising' | 'new';

export function calculateHeat(score: number, comments: number): HeatLevel {
  if (score > 500 || comments > 200) return 'hot';
  if (score > 100 || comments > 50) return 'rising';
  return 'new';
}

export const HEAT_CONFIG: Record<HeatLevel, { label: string; color: string }> = {
  hot:    { label: 'Hot',    color: '#f43f5e' },
  rising: { label: 'Rising', color: '#f59e0b' },
  new:    { label: 'New',    color: '#3d85f5' },
};
