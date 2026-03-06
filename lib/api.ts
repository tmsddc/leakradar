import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/sources';

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
}

export type ScanLogEntry = {
  source: string;
  status: 'scanning' | 'done' | 'error';
  count?: number;
  message?: string;
};

// When Supabase is not configured, use mock data for development
const USE_MOCK = !SUPABASE_URL || SUPABASE_URL.includes('your-project');

const MOCK_POSTS: LeakPost[] = [
  {
    id: 'mock-1',
    title: 'GTA 6 Map Allegedly Leaked Showing Expanded Vice City',
    summary: 'A supposed leak from a Rockstar insider shows the GTA 6 map will feature a significantly larger Vice City with surrounding rural areas, swamps, and multiple smaller towns. The map is said to be roughly 3x the size of GTA V\'s Los Santos.',
    url: 'https://reddit.com/r/GTA6/mock1',
    score: 2450,
    comments: 890,
    timestamp: Date.now() / 1000 - 3600,
    sources: ['r/GTA6', 'r/GamingLeaksAndRumours'],
    category: 'Multi',
    heat: 'hot',
    flair: 'Rumour',
  },
  {
    id: 'mock-2',
    title: 'PlayStation 6 Development Kits Reportedly Sent to Major Studios',
    summary: 'According to industry insiders, Sony has begun distributing PS6 development kits to first-party studios and select third-party partners. The console is rumored to feature a custom AMD chip with ray tracing capabilities far beyond the PS5 Pro.',
    url: 'https://reddit.com/r/PS5/mock2',
    score: 1820,
    comments: 445,
    timestamp: Date.now() / 1000 - 7200,
    sources: ['r/PS5', 'Insider Gaming'],
    category: 'PlayStation',
    heat: 'hot',
    flair: 'Insider Info',
  },
  {
    id: 'mock-3',
    title: 'Nintendo Switch 2 Launch Lineup to Include New 3D Mario',
    summary: 'Multiple sources now confirm that the Nintendo Switch 2 launch lineup will include a brand new 3D Mario game, alongside Mario Kart 9 and a Zelda title. The console is expected to be revealed in a Nintendo Direct next month.',
    url: 'https://reddit.com/r/NintendoSwitch/mock3',
    score: 3100,
    comments: 1200,
    timestamp: Date.now() / 1000 - 1800,
    sources: ['r/NintendoSwitch', 'r/GamingLeaksAndRumours', 'VGC'],
    category: 'Nintendo',
    heat: 'hot',
    flair: 'Leak',
  },
  {
    id: 'mock-4',
    title: 'Xbox Working on Handheld Console Codenamed "Kennan"',
    summary: 'Microsoft is reportedly working on a portable Xbox device codenamed "Kennan". The device would run a modified version of Windows with full Game Pass integration and is targeting a 2027 release window.',
    url: 'https://reddit.com/r/XboxSeriesX/mock4',
    score: 780,
    comments: 234,
    timestamp: Date.now() / 1000 - 14400,
    sources: ['r/XboxSeriesX', 'The Verge'],
    category: 'Xbox',
    heat: 'hot',
    flair: 'Rumour',
  },
  {
    id: 'mock-5',
    title: 'Valve Reportedly Testing Half-Life 3 Internally',
    summary: 'According to a former Valve employee, Half-Life 3 has been in active development for over two years. The game is said to use Source 3 engine and features VR and flat-screen modes.',
    url: 'https://reddit.com/r/pcgaming/mock5',
    score: 5200,
    comments: 2100,
    timestamp: Date.now() / 1000 - 900,
    sources: ['r/pcgaming', 'r/Games', 'PC Gamer'],
    category: 'PC',
    heat: 'hot',
    flair: 'Rumour',
  },
  {
    id: 'mock-6',
    title: 'FromSoftware New IP is a Sci-Fi Action RPG',
    summary: 'FromSoftware\'s next game after Elden Ring DLC is reportedly a brand new sci-fi IP. The game features mech combat, space exploration, and the signature Souls-like difficulty the studio is known for.',
    url: 'https://reddit.com/r/GamingLeaksAndRumours/mock6',
    score: 420,
    comments: 180,
    timestamp: Date.now() / 1000 - 28800,
    sources: ['r/GamingLeaksAndRumours'],
    category: 'Multi',
    heat: 'rising',
    flair: 'Insider Info',
  },
  {
    id: 'mock-7',
    title: 'Assassin\'s Creed Japan Screenshots Allegedly Surface Online',
    summary: 'Alleged in-game screenshots of the next Assassin\'s Creed game set in feudal Japan have appeared on 4chan. The images show detailed environments, a samurai protagonist, and what appears to be a grappling hook mechanic.',
    url: 'https://reddit.com/r/GamingLeaksAndRumours/mock7',
    score: 340,
    comments: 156,
    timestamp: Date.now() / 1000 - 43200,
    sources: ['r/GamingLeaksAndRumours', 'Kotaku'],
    category: 'Multi',
    heat: 'rising',
    flair: 'Leak',
  },
  {
    id: 'mock-8',
    title: 'Steam Summer Sale Dates Leaked by Store Backend',
    summary: 'Data miners have found references to the upcoming Steam Summer Sale dates in the Steam store backend. The sale is expected to start June 26 and run through July 10.',
    url: 'https://reddit.com/r/pcgaming/mock8',
    score: 180,
    comments: 67,
    timestamp: Date.now() / 1000 - 50000,
    sources: ['r/pcgaming'],
    category: 'PC',
    heat: 'rising',
    flair: null,
  },
  {
    id: 'mock-9',
    title: 'Kojima Productions Teasing New Project for Xbox',
    summary: 'Hideo Kojima has been posting cryptic teasers on social media that fans believe point to the Xbox-exclusive game he\'s developing with Microsoft. The game may be revealed at the next Xbox showcase.',
    url: 'https://reddit.com/r/XboxSeriesX/mock9',
    score: 95,
    comments: 45,
    timestamp: Date.now() / 1000 - 72000,
    sources: ['r/XboxSeriesX'],
    category: 'Xbox',
    heat: 'new',
    flair: 'Speculation',
  },
  {
    id: 'mock-10',
    title: 'Naughty Dog Multiplayer Game Still in Development',
    summary: 'Despite recent layoffs, Naughty Dog\'s standalone multiplayer game based on The Last of Us universe is still in active development. The game has reportedly shifted to a smaller-scale PvPvE format.',
    url: 'https://reddit.com/r/PS5/mock10',
    score: 62,
    comments: 28,
    timestamp: Date.now() / 1000 - 86400,
    sources: ['r/PS5', 'Eurogamer'],
    category: 'PlayStation',
    heat: 'new',
    flair: null,
  },
  {
    id: 'mock-11',
    title: 'New Pokemon Game in Development Using Unreal Engine 5',
    summary: 'Game Freak is reportedly developing a new mainline Pokemon game using Unreal Engine 5, a departure from their custom engine. The game targets the Switch 2 hardware.',
    url: 'https://reddit.com/r/NintendoSwitch/mock11',
    score: 45,
    comments: 22,
    timestamp: Date.now() / 1000 - 100000,
    sources: ['r/NintendoSwitch'],
    category: 'Nintendo',
    heat: 'new',
    flair: 'Rumour',
  },
  {
    id: 'mock-12',
    title: 'EA Sports Working on Open-World Racing Game',
    summary: 'EA is reportedly developing a new open-world racing franchise separate from Need for Speed. The game will feature a massive shared world with dynamic weather and seasons.',
    url: 'https://reddit.com/r/Games/mock12',
    score: 35,
    comments: 15,
    timestamp: Date.now() / 1000 - 120000,
    sources: ['r/Games'],
    category: 'Multi',
    heat: 'new',
    flair: null,
  },
];

export async function fetchLeaks(
  onLog?: (entry: ScanLogEntry) => void,
): Promise<LeakPost[]> {
  if (USE_MOCK) {
    // Simulate scanning with delays for mock mode
    const sources = ['r/GamingLeaksAndRumours', 'r/PS5', 'r/XboxSeriesX', 'r/NintendoSwitch', 'r/pcgaming', 'r/GTA6', 'r/Games', 'Insider Gaming', 'VGC', 'Eurogamer'];
    for (const source of sources) {
      onLog?.({ source, status: 'scanning' });
      await new Promise(r => setTimeout(r, 150 + Math.random() * 200));
      onLog?.({ source, status: 'done', count: Math.floor(Math.random() * 15) + 3 });
    }
    return MOCK_POSTS;
  }

  try {
    onLog?.({ source: 'Supabase', status: 'scanning', message: 'Connecting...' });

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/scan-leaks`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: LeakPost[] = await response.json();
    onLog?.({ source: 'Supabase', status: 'done', count: data.length });
    return data;
  } catch (error) {
    onLog?.({ source: 'Supabase', status: 'error', message: String(error) });
    return MOCK_POSTS;
  }
}
