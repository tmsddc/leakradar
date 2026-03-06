import { create } from 'zustand';
import type { LeakPost, ScanLogEntry } from '../lib/api';
import type { AppSettings } from '../lib/storage';
import { DEFAULT_SETTINGS, getSavedPosts, savePost, unsavePost, getSettings, updateSettings, cacheFeed, getCachedFeed } from '../lib/storage';
import type { Category } from '../constants/sources';

interface LeakStore {
  // Feed
  posts: LeakPost[];
  filteredPosts: LeakPost[];
  isScanning: boolean;
  scanLogs: ScanLogEntry[];
  lastScanTime: number | null;
  duplicatesRemoved: number;

  // Filters
  activeCategory: Category;
  searchQuery: string;

  // Saved
  savedPosts: LeakPost[];
  savedPostIds: Set<string>;

  // Settings
  settings: AppSettings;

  // Actions
  setPosts: (posts: LeakPost[], duplicatesRemoved?: number) => void;
  setIsScanning: (scanning: boolean) => void;
  addScanLog: (log: ScanLogEntry) => void;
  clearScanLogs: () => void;
  setActiveCategory: (category: Category) => void;
  setSearchQuery: (query: string) => void;
  toggleSavePost: (post: LeakPost) => Promise<void>;
  loadSavedPosts: () => Promise<void>;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  applyFilters: () => void;
  loadCachedFeed: () => Promise<void>;
}

function filterPosts(posts: LeakPost[], category: Category, searchQuery: string): LeakPost[] {
  let filtered = [...posts];

  // Category filter
  if (category === 'Hot') {
    filtered = filtered.filter(p => p.heat === 'hot');
  } else if (category !== 'All') {
    filtered = filtered.filter(p => p.category === category);
  }

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q)
    );
  }

  return filtered;
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

  savedPosts: [],
  savedPostIds: new Set(),

  settings: DEFAULT_SETTINGS,

  setPosts: (posts, duplicatesRemoved = 0) => {
    set({ posts, duplicatesRemoved, lastScanTime: Date.now() });
    cacheFeed(posts);
    get().applyFilters();
  },

  setIsScanning: (isScanning) => set({ isScanning }),

  addScanLog: (log) => set(state => ({
    scanLogs: [...state.scanLogs, log],
  })),

  clearScanLogs: () => set({ scanLogs: [] }),

  setActiveCategory: (activeCategory) => {
    set({ activeCategory });
    get().applyFilters();
  },

  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
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
    set({
      savedPosts,
      savedPostIds: new Set(savedPosts.map(p => p.id)),
    });
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
    const { posts, activeCategory, searchQuery } = get();
    set({ filteredPosts: filterPosts(posts, activeCategory, searchQuery) });
  },

  loadCachedFeed: async () => {
    const cached = await getCachedFeed();
    if (cached) {
      set({ posts: cached.posts, lastScanTime: cached.timestamp });
      get().applyFilters();
    }
  },
}));
