import { create } from 'zustand';
import type { LeakPost, ScanLogEntry } from '../lib/api';
import type { AppSettings } from '../lib/storage';
import {
  DEFAULT_SETTINGS, getSavedPosts, savePost, unsavePost,
  getSettings, updateSettings, cacheFeed, getCachedFeed,
  getTrackedGames, addTrackedGame, removeTrackedGame,
  getLastSeenCount, setLastSeenCount,
} from '../lib/storage';
import type { Category } from '../constants/sources';

export type SortOption = 'hot' | 'new' | 'top';

interface LeakStore {
  posts: LeakPost[];
  filteredPosts: LeakPost[];
  isScanning: boolean;
  scanLogs: ScanLogEntry[];
  lastScanTime: number | null;
  duplicatesRemoved: number;

  activeCategory: Category;
  searchQuery: string;
  sortOption: SortOption;

  savedPosts: LeakPost[];
  savedPostIds: Set<string>;

  trackedGames: string[];
  unreadCount: number;

  settings: AppSettings;

  setPosts: (posts: LeakPost[], duplicatesRemoved?: number) => Promise<void>;
  setIsScanning: (scanning: boolean) => void;
  addScanLog: (log: ScanLogEntry) => void;
  clearScanLogs: () => void;
  setActiveCategory: (category: Category) => void;
  setSearchQuery: (query: string) => void;
  setSortOption: (sort: SortOption) => void;
  toggleSavePost: (post: LeakPost) => Promise<void>;
  loadSavedPosts: () => Promise<void>;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  applyFilters: () => void;
  loadCachedFeed: () => Promise<void>;
  toggleTrackGame: (game: string) => Promise<void>;
  loadTrackedGames: () => Promise<void>;
  markAllRead: () => Promise<void>;
}

const HEAT_ORDER = { hot: 0, rising: 1, new: 2 };

function sortPosts(posts: LeakPost[], sort: SortOption): LeakPost[] {
  const arr = [...posts];
  switch (sort) {
    case 'hot':
      return arr.sort((a, b) => {
        const hd = HEAT_ORDER[a.heat] - HEAT_ORDER[b.heat];
        return hd !== 0 ? hd : b.score - a.score;
      });
    case 'new':
      return arr.sort((a, b) => b.timestamp - a.timestamp);
    case 'top':
      return arr.sort((a, b) => b.score - a.score);
  }
}

function filterPosts(posts: LeakPost[], category: Category, searchQuery: string, sort: SortOption): LeakPost[] {
  let filtered = [...posts];

  if (category === 'Hot') {
    filtered = filtered.filter(p => p.heat === 'hot');
  } else if (category !== 'All') {
    filtered = filtered.filter(p => p.category === category);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  return sortPosts(filtered, sort);
}

export const useLeakStore = create<LeakStore>((set, get) => ({
  posts: [],
  filteredPosts: [],
  isScanning: false,
  scanLogs: [],
  lastScanTime: null,
  duplicatesRemoved: 0,

  activeCategory: 'All',
  searchQuery: '',
  sortOption: 'hot',

  savedPosts: [],
  savedPostIds: new Set(),

  trackedGames: [],
  unreadCount: 0,

  settings: DEFAULT_SETTINGS,

  setPosts: async (posts, duplicatesRemoved = 0) => {
    const lastSeen = await getLastSeenCount();
    const unreadCount = Math.max(0, posts.length - lastSeen);
    set({ posts, duplicatesRemoved, lastScanTime: Date.now(), unreadCount });
    cacheFeed(posts);
    get().applyFilters();
  },

  setIsScanning: (isScanning) => set({ isScanning }),

  addScanLog: (log) => set(state => ({ scanLogs: [...state.scanLogs, log] })),

  clearScanLogs: () => set({ scanLogs: [] }),

  setActiveCategory: (activeCategory) => {
    set({ activeCategory });
    get().applyFilters();
  },

  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().applyFilters();
  },

  setSortOption: (sortOption) => {
    set({ sortOption });
    get().applyFilters();
  },

  toggleSavePost: async (post) => {
    const { savedPostIds } = get();
    if (savedPostIds.has(post.id)) {
      await unsavePost(post.id);
    } else {
      await savePost(post);
    }
    await get().loadSavedPosts();
  },

  loadSavedPosts: async () => {
    const savedPosts = await getSavedPosts();
    set({ savedPosts, savedPostIds: new Set(savedPosts.map(p => p.id)) });
  },

  loadSettings: async () => {
    const settings = await getSettings();
    set({ settings });
  },

  updateSettings: async (newSettings) => {
    const settings = await updateSettings(newSettings);
    set({ settings });
  },

  applyFilters: () => {
    const { posts, activeCategory, searchQuery, sortOption } = get();
    set({ filteredPosts: filterPosts(posts, activeCategory, searchQuery, sortOption) });
  },

  loadCachedFeed: async () => {
    const cached = await getCachedFeed();
    if (cached) {
      set({ posts: cached.posts, lastScanTime: cached.timestamp });
      get().applyFilters();
    }
  },

  toggleTrackGame: async (game) => {
    const { trackedGames } = get();
    if (trackedGames.includes(game)) {
      await removeTrackedGame(game);
      set({ trackedGames: trackedGames.filter(g => g !== game) });
    } else {
      await addTrackedGame(game);
      set({ trackedGames: [...trackedGames, game] });
    }
  },

  loadTrackedGames: async () => {
    const trackedGames = await getTrackedGames();
    set({ trackedGames });
  },

  markAllRead: async () => {
    const { posts } = get();
    await setLastSeenCount(posts.length);
    set({ unreadCount: 0 });
  },
}));
