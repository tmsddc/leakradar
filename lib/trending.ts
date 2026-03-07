import type { LeakPost } from './api';

export interface TrendingGame {
  name: string;
  postCount: number;
  hotCount: number;
  avgCredibility: number;
  momentum: number; // 0-100
  recentCount: number; // posts in last 6h
}

export interface SourceStat {
  name: string;
  totalPosts: number;
  avgCredibility: number;
  confirmedCount: number;
}

export function getTrendingGames(posts: LeakPost[]): TrendingGame[] {
  const now = Date.now() / 1000;
  const map = new Map<string, { posts: LeakPost[]; recent: number }>();

  for (const post of posts) {
    for (const tag of post.tags) {
      if (!map.has(tag)) map.set(tag, { posts: [], recent: 0 });
      const entry = map.get(tag)!;
      entry.posts.push(post);
      if (now - post.timestamp < 6 * 3600) entry.recent++;
    }
  }

  const games: TrendingGame[] = [];
  for (const [name, { posts: gp, recent }] of map.entries()) {
    const hotCount = gp.filter(p => p.heat === 'hot').length;
    const avgCredibility = Math.round(gp.reduce((s, p) => s + p.credibility, 0) / gp.length);
    const totalScore = gp.reduce((s, p) => s + p.score, 0);
    // Momentum: volume (post count) is the primary driver — more posts = genuinely trending
    // Recency and hot ratio are bonuses, raw score is a small signal
    const volumeScore  = Math.min(Math.log10(Math.max(gp.length, 1) + 1) / Math.log10(20), 1) * 45;
    const recencyBonus = (recent / Math.max(gp.length, 1)) * 25;
    const hotBonus     = (hotCount / Math.max(gp.length, 1)) * 20;
    const scoreBonus   = Math.min(totalScore / 2000, 1) * 10;
    const momentum = Math.min(100, Math.round(volumeScore + recencyBonus + hotBonus + scoreBonus));
    games.push({ name, postCount: gp.length, hotCount, avgCredibility, momentum, recentCount: recent });
  }

  return games.sort((a, b) => b.momentum - a.momentum).slice(0, 10);
}

export function getSourceStats(posts: LeakPost[]): SourceStat[] {
  const map = new Map<string, LeakPost[]>();
  for (const post of posts) {
    for (const source of post.sources) {
      if (!map.has(source)) map.set(source, []);
      map.get(source)!.push(post);
    }
  }

  const stats: SourceStat[] = [];
  for (const [name, sp] of map.entries()) {
    stats.push({
      name,
      totalPosts: sp.length,
      avgCredibility: Math.round(sp.reduce((s, p) => s + p.credibility, 0) / sp.length),
      confirmedCount: sp.filter(p => p.verificationStatus === 'confirmed').length,
    });
  }

  return stats.sort((a, b) => b.avgCredibility - a.avgCredibility).slice(0, 8);
}
