import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LeakPost } from './api';

const KEYS = {
  SAVED_POSTS: '@leakradar/saved_posts',
  SETTINGS: '@leakradar/settings',
  CACHED_FEED: '@leakradar/cached_feed',
  TRACKED_GAMES: '@leakradar/tracked_games',
  LAST_SEEN_COUNT: '@leakradar/last_seen_count',
};

export interface AppSettings {
  refreshInterval: number;
  enabledSubreddits: string[];
  enabledRSSFeeds: string[];
  darkMode: boolean;
  notificationsEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  refreshInterval: 15 * 60 * 1000,
  enabledSubreddits: [
    'GamingLeaksAndRumours', 'PS5', 'XboxSeriesX',
    'NintendoSwitch', 'pcgaming', 'GTA6', 'Games',
  ],
  enabledRSSFeeds: [
    'Insider Gaming', 'VGC', 'Eurogamer', 'Kotaku', 'VG247', 'PC Gamer',
  ],
  darkMode: true,
  notificationsEnabled: true,
};

export async function getSavedPosts(): Promise<LeakPost[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SAVED_POSTS);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export async function savePost(post: LeakPost): Promise<void> {
  const saved = await getSavedPosts();
  if (!saved.find(p => p.id === post.id)) {
    saved.unshift(post);
    await AsyncStorage.setItem(KEYS.SAVED_POSTS, JSON.stringify(saved));
  }
}

export async function unsavePost(postId: string): Promise<void> {
  const saved = await getSavedPosts();
  await AsyncStorage.setItem(KEYS.SAVED_POSTS, JSON.stringify(saved.filter(p => p.id !== postId)));
}

export async function clearSavedPosts(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.SAVED_POSTS);
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated));
  return updated;
}

export async function cacheFeed(posts: LeakPost[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.CACHED_FEED, JSON.stringify({ posts, timestamp: Date.now() }));
}

export async function getCachedFeed(): Promise<{ posts: LeakPost[]; timestamp: number } | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CACHED_FEED);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

export async function getTrackedGames(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.TRACKED_GAMES);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export async function addTrackedGame(game: string): Promise<void> {
  const games = await getTrackedGames();
  if (!games.includes(game)) {
    await AsyncStorage.setItem(KEYS.TRACKED_GAMES, JSON.stringify([...games, game]));
  }
}

export async function removeTrackedGame(game: string): Promise<void> {
  const games = await getTrackedGames();
  await AsyncStorage.setItem(KEYS.TRACKED_GAMES, JSON.stringify(games.filter(g => g !== game)));
}

export async function getLastSeenCount(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(KEYS.LAST_SEEN_COUNT);
    return data ? parseInt(data, 10) : 0;
  } catch { return 0; }
}

export async function setLastSeenCount(count: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_SEEN_COUNT, String(count));
}
