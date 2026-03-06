import type { Category } from '../constants/sources';

const PLATFORM_KEYWORDS: Record<string, string[]> = {
  PlayStation: [
    'ps5', 'ps6', 'playstation', 'sony', 'dualsense', 'naughty dog',
    'insomniac', 'guerrilla', 'santa monica', 'sucker punch',
    'gran turismo', 'god of war', 'spider-man', 'spiderman',
    'horizon', 'uncharted', 'last of us', 'ratchet', 'returnal',
  ],
  Xbox: [
    'xbox', 'microsoft', 'gamepass', 'game pass', 'bethesda', 'halo',
    'starfield', 'fable', 'obsidian', 'forza', 'gears of war',
    'avowed', 'hellblade', 'perfect dark', 'state of decay',
    'activision', 'blizzard', 'call of duty', 'cod',
  ],
  Nintendo: [
    'nintendo', 'switch', 'switch 2', 'mario', 'zelda', 'pokémon',
    'pokemon', 'metroid', 'kirby', 'splatoon', 'animal crossing',
    'fire emblem', 'xenoblade', 'donkey kong', 'pikmin',
  ],
  PC: [
    'steam', 'valve', 'half-life', 'epic games', 'pc exclusive',
    'pc gaming', 'gog', 'steam deck', 'counter-strike', 'dota',
  ],
};

type PostCategory = Exclude<Category, 'All' | 'Hot'>;

export function categorizePost(title: string, body?: string): PostCategory {
  const text = `${title} ${body || ''}`.toLowerCase();
  const matches: string[] = [];

  for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matches.push(platform);
        break;
      }
    }
  }

  if (matches.length === 0 || matches.length > 1) return 'Multi';
  return matches[0] as PostCategory;
}
