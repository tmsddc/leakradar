import { SUPABASE_URL, SUPABASE_ANON_KEY, SUBREDDITS, RSS_FEEDS, CHAN_SOURCES } from '../constants/sources';
import { categorizePost } from './categorize';
import { calculateHeat } from './heat';

export type PostType = 'leak' | 'rumour' | 'news';

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
  postType: PostType;
  flair: string | null;
  credibility: number; // 0-100
  verificationStatus: 'confirmed' | 'denied' | 'pending';
  tags: string[];
  thumbnail?: string; // Optional image URL
  duplicateCount?: number; // Set by deduplication — number of posts merged into this one
}

export type ScanLogEntry = {
  source: string;
  status: 'scanning' | 'done' | 'error';
  count?: number;
  message?: string;
};

// ─── Post type classification ────────────────────────────────────────────────

const LEAK_FLAIR_KEYWORDS    = ['leak', 'leaked', 'datamine', 'datamined'];
const RUMOUR_FLAIR_KEYWORDS  = ['rumour', 'rumor', 'insider', 'speculation', 'speculative', 'unverified', 'report'];
const NEWS_FLAIR_KEYWORDS    = ['news', 'article', 'official', 'announcement', 'confirmed', 'discussion', 'question'];

const LEAK_TITLE_KEYWORDS    = [' leak', ' leaked', ' leaks', 'datamine', 'datamined', 'alleged ', 'allegedly'];
const RUMOUR_TITLE_KEYWORDS  = ['rumour', 'rumor', 'reportedly', 'reportedly', 'sources say', 'sources claim',
                                'insider', 'according to', 'may be', 'could be', 'might be', 'said to be',
                                'unconfirmed', 'speculation', 'possibly', 'possibly', 'hints at'];

// Subreddits where content is predominantly leaks/rumours
const LEAK_SUBREDDITS = new Set(['GamingLeaksAndRumours', 'GTA6']);

function classifyPostType(subreddit: string | null, flair: string | null, title: string, isRSS: boolean): PostType {
  // RSS feeds are always news articles
  if (isRSS) return 'news';

  const flairLow = (flair ?? '').toLowerCase();
  const titleLow = title.toLowerCase();

  // Flair is the most reliable signal
  if (flairLow) {
    if (LEAK_FLAIR_KEYWORDS.some(k => flairLow.includes(k)))   return 'leak';
    if (RUMOUR_FLAIR_KEYWORDS.some(k => flairLow.includes(k))) return 'rumour';
    if (NEWS_FLAIR_KEYWORDS.some(k => flairLow.includes(k)))   return 'news';
  }

  // Title keywords
  if (LEAK_TITLE_KEYWORDS.some(k => titleLow.includes(k)))    return 'leak';
  if (RUMOUR_TITLE_KEYWORDS.some(k => titleLow.includes(k)))  return 'rumour';

  // Subreddit default
  if (subreddit && LEAK_SUBREDDITS.has(subreddit)) return 'rumour';

  return 'news';
}

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

const REDDIT_TIMEOUT_MS = 10000;
const RSS_TIMEOUT_MS = 18000;

function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs = REDDIT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function extractThumbnail(p: any): string | undefined {
  // Prefer preview images - higher quality and more reliable to load
  const preview = p.preview?.images?.[0];
  if (preview) {
    // Use source if available and not too large (>600px wide)
    const source = preview.source;
    if (source?.url && source.width <= 600) {
      return source.url.replace(/&amp;/g, '&');
    }
    // Otherwise pick a medium-resolution thumbnail from resolutions
    const resolutions = preview.resolutions;
    if (resolutions && resolutions.length > 0) {
      // Pick one that's around 320-480px wide
      const good = resolutions.find((r: any) => r.width >= 300 && r.width <= 500)
        ?? resolutions[resolutions.length - 1];
      if (good?.url) return good.url.replace(/&amp;/g, '&');
    }
  }
  // Fallback: reddit thumbnail (small ~70px, often low quality or blocked)
  const t = p.thumbnail;
  if (
    t && typeof t === 'string' && t.startsWith('https') &&
    !['self', 'default', 'nsfw', 'spoiler', 'image'].includes(t)
  ) {
    return t;
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
          postType: classifyPostType(subreddit, p.link_flair_text || null, p.title, false),
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

// ─── Minimal RSS/Atom XML parser (no external dependencies) ────────────────
// React Native has no CORS restrictions (it's not a browser), so we can
// fetch RSS feeds directly from their source URLs.

function xmlText(block: string, tag: string): string {
  // Matches both <tag>value</tag> and <tag><![CDATA[value]]></tag>
  const re = new RegExp(
    `<${tag}[^>]*>(?:\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>`,
    'i',
  );
  const m = block.match(re);
  if (!m) return '';
  return (m[1] ?? m[2] ?? '').trim();
}

function xmlItemAttr(block: string, fullTag: string, attr: string): string {
  const re = new RegExp(`<${fullTag}[^>]*\\s${attr}="([^"]*)"[^>]*>`, 'i');
  const m = block.match(re);
  return m ? m[1] : '';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function htmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  thumbnail?: string;
}

function parseRSSXML(xml: string): RSSItem[] {
  const items: RSSItem[] = [];

  // Support both RSS <item> and Atom <entry>
  const itemRe = /<(?:item|entry)(?:\s[^>]*)?>[\s\S]*?<\/(?:item|entry)>/gi;
  let m: RegExpExecArray | null;

  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[0];

    const title = htmlEntities(stripHtml(xmlText(block, 'title')));

    // RSS link is in <link> or <link href="..."/>
    let link = xmlText(block, 'link');
    if (!link) {
      // Atom: <link href="url"/>
      const atomLink = block.match(/<link[^>]*\shref="([^"]+)"/i);
      link = atomLink ? atomLink[1] : '';
    }
    link = htmlEntities(link.trim());

    const description = stripHtml(
      htmlEntities(
        xmlText(block, 'description') ||
        xmlText(block, 'content:encoded') ||
        xmlText(block, 'content') ||
        xmlText(block, 'summary'),
      ),
    ).slice(0, 400);

    const pubDate =
      xmlText(block, 'pubDate') ||
      xmlText(block, 'published') ||
      xmlText(block, 'updated') ||
      xmlText(block, 'dc:date') || '';

    // Image: enclosure url, media:thumbnail, media:content, itunes:image
    const enclosure = xmlItemAttr(block, 'enclosure', 'url');
    const mediaThumbnail = xmlItemAttr(block, 'media:thumbnail', 'url')
      || xmlItemAttr(block, 'media:content', 'url');
    const thumbnail = enclosure || mediaThumbnail || undefined;

    if (title) {
      items.push({ title, link, description, pubDate, thumbnail });
    }
  }

  return items;
}

// Fetch RSS feed directly (no proxy needed - React Native has no CORS)
async function fetchRSS(
  name: string,
  feedUrl: string,
  onLog?: (e: ScanLogEntry) => void,
): Promise<LeakPost[]> {
  onLog?.({ source: name, status: 'scanning' });
  try {
    const res = await fetchWithTimeout(feedUrl, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; LeakRadar/1.0)',
      },
    }, RSS_TIMEOUT_MS);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const items = parseRSSXML(xml);
    if (items.length === 0) throw new Error('No items parsed from feed');

    const posts: LeakPost[] = items.slice(0, 15).map((item) => {
      const id = `rss-${name.replace(/\s/g, '-')}-${(item.link || item.title).replace(/[^a-z0-9]/gi, '').slice(-20)}`;
      const timestamp = item.pubDate ? new Date(item.pubDate).getTime() / 1000 : Date.now() / 1000;
      return {
        id,
        title: item.title,
        summary: item.description,
        url: item.link,
        score: 0,
        comments: 0,
        timestamp: isNaN(timestamp) ? Date.now() / 1000 : timestamp,
        sources: [name],
        category: categorizePost(item.title, item.description),
        heat: 'new' as const,
        flair: null,
        postType: classifyPostType(null, null, item.title, true),
        credibility: 72,
        verificationStatus: 'pending' as const,
        tags: extractTags(item.title),
        thumbnail: item.thumbnail,
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

// ─── 4chan via Desuarchive search API ───────────────────────────────────────

async function fetchChan(
  board: string,
  searchTerms: string[],
  sourceName: string,
  onLog?: (e: ScanLogEntry) => void,
): Promise<LeakPost[]> {
  const source = sourceName;
  onLog?.({ source, status: 'scanning' });
  try {
    const query = searchTerms.join('+');
    const url = `https://desuarchive.org/_/api/chan/search/?boards=${board}&text=${query}&page=1`;
    const res = await fetchWithTimeout(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeakRadar/1.0)' },
    }, RSS_TIMEOUT_MS);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    // Desuarchive returns { "0": { "posts": [...] }, "1": {...}, ... }
    const allPosts: any[] = [];
    for (const key of Object.keys(json)) {
      const group = json[key];
      if (group?.posts && Array.isArray(group.posts)) {
        allPosts.push(...group.posts);
      }
    }

    if (allPosts.length === 0) throw new Error('No posts returned');

    const posts: LeakPost[] = allPosts
      .filter((p: any) => p.op === '1' || p.op === 1) // thread OPs only
      .slice(0, 20)
      .map((p: any) => {
        const timestamp = parseInt(p.timestamp ?? '0', 10) || Date.now() / 1000;
        const title = p.subject
          ? String(p.subject).slice(0, 200)
          : String(p.comment ?? '').replace(/<[^>]+>/g, ' ').slice(0, 120) + '…';
        const summary = String(p.comment ?? '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim()
          .slice(0, 400);
        const chanUrl = `https://desuarchive.org/${board}/thread/${p.thread_num ?? p.num}/`;
        const score = parseInt(p.replies ?? '0', 10) || 0;

        return {
          id: `4chan-${board}-${p.num}`,
          title,
          summary,
          url: chanUrl,
          score,
          comments: score,
          timestamp,
          sources: [source],
          category: categorizePost(title, summary),
          heat: calculateHeat(score, 0),
          flair: `/v/`,
          postType: classifyPostType(null, null, title, false),
          credibility: 40, // 4chan has lower baseline credibility
          verificationStatus: 'pending' as const,
          tags: extractTags(title),
          thumbnail: p.media?.thumb_link || undefined,
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

const USE_SUPABASE = SUPABASE_URL && !SUPABASE_URL.includes('your-project');

export async function fetchLeaks(
  onLog?: (entry: ScanLogEntry) => void,
  enabledSubreddits?: string[],
  enabledRSSFeeds?: string[],
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

  // Only fetch sources enabled in settings
  const activeSubs = SUBREDDITS.filter(s =>
    !enabledSubreddits || enabledSubreddits.includes(s.subreddit),
  );
  const activeFeeds = RSS_FEEDS.filter(f =>
    !enabledRSSFeeds || enabledRSSFeeds.includes(f.name),
  );

  // Direct Reddit + RSS + 4chan fetching
  const redditPromises = activeSubs.map(s => fetchSubreddit(s.subreddit, onLog));
  const rssPromises = activeFeeds.map(f => fetchRSS(f.name, f.url, onLog));
  const chanPromises = CHAN_SOURCES.map(c => fetchChan(c.board, c.searchTerms, c.name, onLog));

  const results = await Promise.allSettled([...redditPromises, ...rssPromises, ...chanPromises]);
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
    category: 'Multi', heat: 'hot', flair: 'Rumour', postType: 'rumour' as PostType,
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
    category: 'PlayStation', heat: 'hot', flair: 'Insider Info', postType: 'rumour' as PostType,
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
    category: 'Nintendo', heat: 'hot', flair: 'Leak', postType: 'leak' as PostType,
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
    category: 'Xbox', heat: 'hot', flair: 'Rumour', postType: 'rumour' as PostType,
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
    category: 'PC', heat: 'hot', flair: 'Rumour', postType: 'rumour' as PostType,
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
    category: 'Multi', heat: 'hot', flair: 'Leak', postType: 'leak' as PostType,
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
    category: 'Multi', heat: 'hot', flair: 'Insider Info', postType: 'rumour' as PostType,
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
    category: 'PC', heat: 'hot', flair: 'Confirmed', postType: 'news' as PostType,
    credibility: 97, verificationStatus: 'confirmed',
    tags: ['Cyberpunk 2077', 'CD Projekt Red'],
  },
];
