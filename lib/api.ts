import { SUPABASE_URL, SUPABASE_ANON_KEY, SUBREDDITS, RSS_FEEDS } from '../constants/sources';
import { categorizePost } from './categorize';
import { calculateHeat } from './heat';

export interface LeakPost {
  id: string;
  title: string;
  summary: string;
  url: string;
  score: number;
  comments: number;
  timestamp: number;
  sources: string[];
  category: string;
  heat: 'hot' | 'rising' | 'new';
  flair: string | null;
  credibility: number; // 0-100
  verificationStatus: 'confirmed' | 'denied' | 'pending';
  tags: string[];
  thumbnail?: string; // Optional image URL
}

export type ScanLogEntry = {
  source: string;
  status: 'scanning' | 'done' | 'error';
  count?: number;
  message?: string;
};

// Credibility based on source reputation + engagement
const SUBREDDIT_REPUTATION: Record<string, number> = {
  GamingLeaksAndRumours: 65,
  PS5: 60,
  XboxSeriesX: 60,
  NintendoSwitch: 60,
  pcgaming: 62,
  GTA6: 55,
  Games: 68,
};

function calcCredibility(score: number, comments: number, subreddit: string, hasFlair: boolean): number {
  const base = SUBREDDIT_REPUTATION[subreddit] ?? 50;
  const engBonus = Math.min(25, Math.log10(Math.max(score + comments + 1, 1)) * 8);
  const flairBonus = hasFlair ? 5 : 0;
  return Math.min(99, Math.round(base + engBonus + flairBonus));
}

const KNOWN_TAGS: string[] = [
  'GTA 6', 'PlayStation 6', 'PS6', 'Nintendo Switch 2', 'Xbox Series',
  'Half-Life 3', 'Elden Ring', 'Call of Duty', 'Minecraft', 'Pokemon',
  'Pokémon', 'Cyberpunk', 'Diablo', 'Kojima', 'FromSoftware', 'Valve',
  'Rockstar', 'Ubisoft', 'Naughty Dog', 'CDPR', 'Bethesda', 'Capcom',
  'Square Enix', 'Assassin\'s Creed', 'Mario', 'Zelda', 'Metroid',
  'Starfield', 'Halo', 'God of War', 'Spider-Man', 'Horizon',
  'Xbox Handheld', 'Steam Deck', 'Steam', 'Game Pass', 'Xbox',
];

function extractTags(title: string): string[] {
  const lower = title.toLowerCase();
  return KNOWN_TAGS.filter(tag => lower.includes(tag.toLowerCase())).slice(0, 4);
}

const FETCH_TIMEOUT_MS = 10000;

function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function extractThumbnail(p: any): string | undefined {
  const t = p.thumbnail;
  if (t && typeof t === 'string' && t.startsWith('http') && !['self', 'default', 'nsfw', 'spoiler'].includes(t)) {
    return t;
  }
  // Try preview images
  const preview = p.preview?.images?.[0]?.resolutions;
  if (preview && preview.length > 0) {
    const mid = preview[Math.min(2, preview.length - 1)];
    if (mid?.url) return mid.url.replace(/&amp;/g, '&');
  }
  return undefined;
}

// Fetch one subreddit via Reddit JSON API (no auth needed for public subs)
async function fetchSubreddit(
  subreddit: string,
  onLog?: (e: ScanLogEntry) => void,
): Promise<LeakPost[]> {
  const source = `r/${subreddit}`;
  onLog?.({ source, status: 'scanning' });
  try {
    const res = await fetchWithTimeout(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=30`,
      { headers: { 'User-Agent': 'mobile:leakradar:1.0.0' } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const posts: LeakPost[] = json.data.children
      .filter((c: any) => !c.data.stickied && c.data.score > 5)
      .map((c: any) => {
        const p = c.data;
        const score = p.score ?? 0;
        const comments = p.num_comments ?? 0;
        const hasFlair = !!p.link_flair_text;
        return {
          id: p.id,
          title: p.title,
          summary: (p.selftext || '').slice(0, 400),
          url: `https://reddit.com${p.permalink}`,
          score,
          comments,
          timestamp: p.created_utc,
          sources: [source],
          category: categorizePost(p.title, p.selftext || ''),
          heat: calculateHeat(score, comments),
          flair: p.link_flair_text || null,
          credibility: calcCredibility(score, comments, subreddit, hasFlair),
          verificationStatus: 'pending' as const,
          tags: extractTags(p.title),
          thumbnail: extractThumbnail(p),
        };
      });
    onLog?.({ source, status: 'done', count: posts.length });
    return posts;
  } catch (e: any) {
    const msg = e?.name === 'AbortError' ? 'Timeout' : String(e);
    onLog?.({ source, status: 'error', message: msg });
    return [];
  }
}

// Fetch RSS feed via rss2json.com (free tier, no key needed for basic use)
async function fetchRSS(
  name: string,
  feedUrl: string,
  onLog?: (e: ScanLogEntry) => void,
): Promise<LeakPost[]> {
  onLog?.({ source: name, status: 'scanning' });
  try {
    const encodedUrl = encodeURIComponent(feedUrl);
    const res = await fetchWithTimeout(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodedUrl}&count=15`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.status !== 'ok') throw new Error(json.message || 'RSS error');
    const posts: LeakPost[] = (json.items || []).map((item: any) => {
      const id = `rss-${name.replace(/\s/g, '-')}-${(item.link || item.title || '').replace(/[^a-z0-9]/gi, '').slice(-16)}`;
      const title = item.title || '';
      // Strip HTML from description
      const summary = (item.description || item.content || '')
        .replace(/<[^>]+>/g, '')
        .slice(0, 400)
        .trim();
      const timestamp = item.pubDate ? new Date(item.pubDate).getTime() / 1000 : Date.now() / 1000;
      return {
        id,
        title,
        summary,
        url: item.link || '',
        score: 0,
        comments: 0,
        timestamp,
        sources: [name],
        category: categorizePost(title, summary),
        heat: 'new' as const,
        flair: null,
        credibility: 70, // Gaming media sites default higher credibility
        verificationStatus: 'pending' as const,
        tags: extractTags(title),
      };
    });
    onLog?.({ source: name, status: 'done', count: posts.length });
    return posts;
  } catch (e: any) {
    const msg = e?.name === 'AbortError' ? 'Timeout' : String(e);
    onLog?.({ source: name, status: 'error', message: msg });
    return [];
  }
}

const USE_SUPABASE = SUPABASE_URL && !SUPABASE_URL.includes('your-project');

export async function fetchLeaks(
  onLog?: (entry: ScanLogEntry) => void,
): Promise<LeakPost[]> {
  // Try Supabase Edge Function first if configured
  if (USE_SUPABASE) {
    try {
      onLog?.({ source: 'Supabase', status: 'scanning', message: 'Connecting...' });
      const res = await fetch(`${SUPABASE_URL}/functions/v1/scan-leaks`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data: LeakPost[] = await res.json();
      onLog?.({ source: 'Supabase', status: 'done', count: data.length });
      return data;
    } catch (e) {
      onLog?.({ source: 'Supabase', status: 'error', message: String(e) });
    }
  }

  // Direct Reddit + RSS fetching
  const redditPromises = SUBREDDITS.map(s => fetchSubreddit(s.subreddit, onLog));
  const rssPromises = RSS_FEEDS.map(f => fetchRSS(f.name, f.url, onLog));

  const results = await Promise.allSettled([...redditPromises, ...rssPromises]);
  const allPosts: LeakPost[] = results
    .filter((r): r is PromiseFulfilledResult<LeakPost[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);

  if (allPosts.length === 0) {
    // All sources failed — return mock data
    onLog?.({ source: 'Offline', status: 'error', message: 'Using cached mock data' });
    return MOCK_POSTS;
  }

  return allPosts;
}

// Mock data as offline fallback
export const MOCK_POSTS: LeakPost[] = [
  {
    id: 'mock-1',
    title: 'GTA 6 Map Allegedly Leaked Showing Expanded Vice City',
    summary: "A supposed leak from a Rockstar insider shows the GTA 6 map will feature a significantly larger Vice City with surrounding rural areas, swamps, and multiple smaller towns.",
    url: 'https://reddit.com/r/GTA6',
    score: 2450, comments: 890,
    timestamp: Date.now() / 1000 - 3600,
    sources: ['r/GTA6', 'r/GamingLeaksAndRumours'],
    category: 'Multi', heat: 'hot', flair: 'Rumour',
    credibility: 72, verificationStatus: 'pending',
    tags: ['GTA 6', 'Rockstar Games'],
  },
  {
    id: 'mock-2',
    title: 'PlayStation 6 Development Kits Reportedly Sent to Major Studios',
    summary: 'Sony has begun distributing PS6 development kits to first-party studios. The console is rumored to feature a custom AMD chip with ray tracing far beyond the PS5 Pro.',
    url: 'https://reddit.com/r/PS5',
    score: 1820, comments: 445,
    timestamp: Date.now() / 1000 - 7200,
    sources: ['r/PS5', 'Insider Gaming'],
    category: 'PlayStation', heat: 'hot', flair: 'Insider Info',
    credibility: 85, verificationStatus: 'pending',
    tags: ['PS6', 'Sony', 'Next-Gen Console'],
  },
  {
    id: 'mock-3',
    title: 'Nintendo Switch 2 Launch Lineup to Include New 3D Mario',
    summary: 'Multiple sources confirm that the Nintendo Switch 2 launch lineup will include a new 3D Mario, Mario Kart 9, and a Zelda title.',
    url: 'https://reddit.com/r/NintendoSwitch',
    score: 3100, comments: 1200,
    timestamp: Date.now() / 1000 - 1800,
    sources: ['r/NintendoSwitch', 'r/GamingLeaksAndRumours', 'VGC'],
    category: 'Nintendo', heat: 'hot', flair: 'Leak',
    credibility: 91, verificationStatus: 'confirmed',
    tags: ['Nintendo Switch 2', 'Mario', 'Nintendo'],
  },
  {
    id: 'mock-4',
    title: 'Xbox Working on Handheld Console Codenamed "Kennan"',
    summary: 'Microsoft is reportedly working on a portable Xbox device codenamed "Kennan" with full Game Pass integration, targeting a 2027 release.',
    url: 'https://reddit.com/r/XboxSeriesX',
    score: 780, comments: 234,
    timestamp: Date.now() / 1000 - 14400,
    sources: ['r/XboxSeriesX', 'The Verge'],
    category: 'Xbox', heat: 'hot', flair: 'Rumour',
    credibility: 68, verificationStatus: 'pending',
    tags: ['Xbox Handheld', 'Microsoft', 'Game Pass'],
  },
  {
    id: 'mock-5',
    title: 'Valve Reportedly Testing Half-Life 3 Internally',
    summary: 'A former Valve employee claims Half-Life 3 has been in active development for over two years using Source 3 engine with both VR and flat-screen modes.',
    url: 'https://reddit.com/r/pcgaming',
    score: 5200, comments: 2100,
    timestamp: Date.now() / 1000 - 900,
    sources: ['r/pcgaming', 'r/Games', 'PC Gamer'],
    category: 'PC', heat: 'hot', flair: 'Rumour',
    credibility: 45, verificationStatus: 'pending',
    tags: ['Half-Life 3', 'Valve', 'Steam'],
  },
  {
    id: 'mock-6',
    title: 'Elden Ring 2 Trademarked by FromSoftware in Multiple Regions',
    summary: 'Trademark filings in the EU, US, and Japan show FromSoftware registered "Elden Ring II". The filings cover video games, merchandise, and animated content.',
    url: 'https://reddit.com/r/GamingLeaksAndRumours',
    score: 6200, comments: 2400,
    timestamp: Date.now() / 1000 - 300,
    sources: ['r/GamingLeaksAndRumours', 'r/Games', 'Eurogamer'],
    category: 'Multi', heat: 'hot', flair: 'Leak',
    credibility: 93, verificationStatus: 'pending',
    tags: ['Elden Ring', 'FromSoftware'],
  },
  {
    id: 'mock-7',
    title: 'GTA 6 Release Date Narrowed to Fall 2025',
    summary: 'Take-Two insiders claim GTA 6 is targeting a September-November 2025 launch. The game reportedly passed certification and marketing begins Q2 2025.',
    url: 'https://reddit.com/r/GTA6',
    score: 4800, comments: 1650,
    timestamp: Date.now() / 1000 - 600,
    sources: ['r/GTA6', 'VGC', 'Insider Gaming'],
    category: 'Multi', heat: 'hot', flair: 'Insider Info',
    credibility: 79, verificationStatus: 'pending',
    tags: ['GTA 6', 'Rockstar Games'],
  },
  {
    id: 'mock-8',
    title: 'Cyberpunk 2077 Sequel "Orion" Enters Full Production',
    summary: 'CD Projekt Red confirmed internally that the Cyberpunk sequel "Orion" moved to full production with 400+ developers across two studios.',
    url: 'https://reddit.com/r/Games',
    score: 4100, comments: 1580,
    timestamp: Date.now() / 1000 - 7800,
    sources: ['r/Games', 'r/GamingLeaksAndRumours', 'Eurogamer', 'VGC'],
    category: 'PC', heat: 'hot', flair: 'Confirmed',
    credibility: 97, verificationStatus: 'confirmed',
    tags: ['Cyberpunk 2077', 'CD Projekt Red'],
  },
];
