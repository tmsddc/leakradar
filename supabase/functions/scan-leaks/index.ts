// Supabase Edge Function: scan-leaks
// Deploy with: supabase functions deploy scan-leaks
// This function fetches gaming leaks from Reddit and RSS feeds,
// normalizes them, deduplicates, and returns clean JSON.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache
let cachedResult: { data: any[]; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const SUBREDDITS = [
  'GamingLeaksAndRumours',
  'PS5',
  'XboxSeriesX',
  'NintendoSwitch',
  'pcgaming',
  'GTA6',
  'Games',
];

const RSS_FEEDS = [
  { name: 'Insider Gaming', url: 'https://insider-gaming.com/feed/' },
  { name: 'VGC', url: 'https://www.videogameschronicle.com/feed' },
  { name: 'Eurogamer', url: 'https://www.eurogamer.net/feed' },
  { name: 'Kotaku', url: 'https://kotaku.com/rss' },
  { name: 'VG247', url: 'https://www.vg247.com/feed' },
  { name: 'PC Gamer', url: 'https://www.pcgamer.com/rss' },
];

const PLATFORM_KEYWORDS: Record<string, string[]> = {
  PlayStation: ['ps5', 'ps6', 'playstation', 'sony', 'dualsense', 'naughty dog', 'insomniac', 'guerrilla'],
  Xbox: ['xbox', 'microsoft', 'gamepass', 'game pass', 'bethesda', 'halo', 'starfield', 'fable', 'obsidian'],
  Nintendo: ['nintendo', 'switch', 'mario', 'zelda', 'pokémon', 'pokemon', 'metroid'],
  PC: ['steam', 'valve', 'half-life', 'epic games', 'pc exclusive'],
};

function categorize(title: string, body?: string): string {
  const text = `${title} ${body || ''}`.toLowerCase();
  const matches: string[] = [];
  for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) matches.push(platform);
  }
  return matches.length === 1 ? matches[0] : 'Multi';
}

function calculateHeat(score: number, comments: number): 'hot' | 'rising' | 'new' {
  if (score > 500 || comments > 200) return 'hot';
  if (score > 100 || comments > 50) return 'rising';
  return 'new';
}

// Simple dedup using Jaccard similarity
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\[.*?\]\s*/g, '')
    .replace(/^(rumou?r|leak|report|insider|breaking|exclusive)\s*[:\-–—]\s*/i, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function jaccardSimilarity(a: string, b: string): number {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'with', 'from', 'by', 'that', 'this', 'it']);
  const tokenize = (s: string) => new Set(s.split(' ').filter(w => w.length > 1 && !stopWords.has(w)));
  const setA = tokenize(a);
  const setB = tokenize(b);
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

interface NormalizedPost {
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
}

async function fetchReddit(subreddit: string): Promise<NormalizedPost[]> {
  try {
    const res = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=20&raw_json=1`,
      { headers: { 'User-Agent': 'LeakRadar/1.0' } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data?.children || []).map((child: any) => {
      const d = child.data;
      return {
        id: d.id,
        title: d.title,
        summary: (d.selftext || '').slice(0, 300),
        url: `https://reddit.com${d.permalink}`,
        score: d.score || 0,
        comments: d.num_comments || 0,
        timestamp: d.created_utc || Date.now() / 1000,
        sources: [`r/${subreddit}`],
        category: categorize(d.title, d.selftext),
        heat: calculateHeat(d.score || 0, d.num_comments || 0),
        flair: d.link_flair_text || null,
      };
    });
  } catch {
    return [];
  }
}

function parseXMLValue(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return (match?.[1] || match?.[2] || '').trim();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim();
}

async function fetchRSS(name: string, url: string): Promise<NormalizedPost[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LeakRadar/1.0' },
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const items: NormalizedPost[] = [];
    const itemMatches = xml.match(/<item[\s>][\s\S]*?<\/item>/g) || [];

    for (const item of itemMatches.slice(0, 15)) {
      const title = stripHtml(parseXMLValue(item, 'title'));
      const description = stripHtml(parseXMLValue(item, 'description')).slice(0, 300);
      const link = parseXMLValue(item, 'link');
      const pubDate = parseXMLValue(item, 'pubDate');

      if (!title) continue;

      items.push({
        id: `rss-${name}-${Buffer.from(link || title).toString('base64').slice(0, 20)}`,
        title,
        summary: description,
        url: link,
        score: 0,
        comments: 0,
        timestamp: pubDate ? new Date(pubDate).getTime() / 1000 : Date.now() / 1000,
        sources: [name],
        category: categorize(title, description),
        heat: 'new' as const,
        flair: null,
      });
    }
    return items;
  } catch {
    return [];
  }
}

function deduplicatePosts(posts: NormalizedPost[]): NormalizedPost[] {
  const normalized = posts.map(p => ({
    post: p,
    norm: normalizeTitle(p.title),
  }));

  const merged = new Array(posts.length).fill(false);
  const results: NormalizedPost[] = [];

  for (let i = 0; i < normalized.length; i++) {
    if (merged[i]) continue;
    const group = [normalized[i]];
    merged[i] = true;

    for (let j = i + 1; j < normalized.length; j++) {
      if (merged[j]) continue;
      if (jaccardSimilarity(normalized[i].norm, normalized[j].norm) >= 0.55) {
        group.push(normalized[j]);
        merged[j] = true;
      }
    }

    group.sort((a, b) => b.post.score - a.post.score);
    const primary = { ...group[0].post };
    primary.sources = [...new Set(group.flatMap(g => g.post.sources))];
    results.push(primary);
  }

  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  // Check cache
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
    return new Response(JSON.stringify(cachedResult.data), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  try {
    // Fetch all sources in parallel
    const redditPromises = SUBREDDITS.map(sub => fetchReddit(sub));
    const rssPromises = RSS_FEEDS.map(feed => fetchRSS(feed.name, feed.url));

    const results = await Promise.all([...redditPromises, ...rssPromises]);
    const allPosts = results.flat();

    // Deduplicate and sort
    const deduped = deduplicatePosts(allPosts);
    deduped.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);

    // Cache
    cachedResult = { data: deduped, timestamp: Date.now() };

    return new Response(JSON.stringify(deduped), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
