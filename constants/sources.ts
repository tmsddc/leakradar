export interface SubredditSource {
  name: string;
  subreddit: string;
  color: string;
  emoji: string;
}

export interface RSSSource {
  name: string;
  url: string;
  color: string;
  emoji: string;
}

export const SUBREDDITS: SubredditSource[] = [
  { name: 'GamingLeaksAndRumours', subreddit: 'GamingLeaksAndRumours', color: '#ef4444', emoji: '🔴' },
  { name: 'PS5', subreddit: 'PS5', color: '#2563eb', emoji: '🔵' },
  { name: 'XboxSeriesX', subreddit: 'XboxSeriesX', color: '#16a34a', emoji: '🟢' },
  { name: 'NintendoSwitch', subreddit: 'NintendoSwitch', color: '#dc2626', emoji: '🔴' },
  { name: 'pcgaming', subreddit: 'pcgaming', color: '#9333ea', emoji: '🟣' },
  { name: 'GTA6', subreddit: 'GTA6', color: '#f59e0b', emoji: '🟡' },
  { name: 'Games', subreddit: 'Games', color: '#6366f1', emoji: '🟣' },
];

export const RSS_FEEDS: RSSSource[] = [
  { name: 'Insider Gaming', url: 'https://insider-gaming.com/feed/', color: '#f43f5e', emoji: '🌐' },
  { name: 'VGC', url: 'https://www.videogameschronicle.com/feed', color: '#8b5cf6', emoji: '🌐' },
  { name: 'Eurogamer', url: 'https://www.eurogamer.net/feed', color: '#0ea5e9', emoji: '🌐' },
  { name: 'Kotaku', url: 'https://kotaku.com/rss', color: '#10b981', emoji: '🌐' },
  { name: 'VG247', url: 'https://www.vg247.com/feed', color: '#f97316', emoji: '🌐' },
  { name: 'PC Gamer', url: 'https://www.pcgamer.com/rss', color: '#ec4899', emoji: '🌐' },
  { name: 'Gematsu', url: 'https://www.gematsu.com/feed', color: '#6366f1', emoji: '🌐' },
  { name: 'Game Rant', url: 'https://gamerant.com/feed/', color: '#f59e0b', emoji: '🌐' },
  { name: 'IGN', url: 'https://feeds.feedburner.com/ign/games-all', color: '#ef4444', emoji: '🌐' },
];

export interface ChanSource {
  name: string;
  board: string;
  searchTerms: string[];
  color: string;
}

// 4chan boards fetched via Desuarchive search API
export const CHAN_SOURCES: ChanSource[] = [
  {
    name: '4chan /v/',
    board: 'v',
    searchTerms: ['leak', 'rumor', 'insider'],
    color: '#22c55e',
  },
];

export const ALL_SOURCE_NAMES = [
  ...SUBREDDITS.map(s => s.name),
  ...RSS_FEEDS.map(s => s.name),
];

export const REFRESH_INTERVALS = [
  { label: '5 minutes', value: 5 * 60 * 1000 },
  { label: '15 minutes', value: 15 * 60 * 1000 },
  { label: '30 minutes', value: 30 * 60 * 1000 },
  { label: '1 hour', value: 60 * 60 * 1000 },
  { label: 'Manual only', value: 0 },
];

export const CATEGORIES = ['All', 'Hot', 'PlayStation', 'Xbox', 'Nintendo', 'PC', 'Multi'] as const;
export type Category = (typeof CATEGORIES)[number];

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
