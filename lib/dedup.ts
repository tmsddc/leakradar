import type { LeakPost } from './api';

const STRIP_PREFIXES = /^(rumou?r|leak|report|insider|breaking|exclusive|confirmed|update|news)\s*[:\-–—]\s*/i;
const STRIP_BRACKETS = /\[.*?\]\s*/g;

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(STRIP_BRACKETS, '')
    .replace(STRIP_PREFIXES, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): Set<string> {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but', 'with', 'from', 'by', 'that', 'this', 'it', 'its', 'be', 'has', 'have', 'had', 'will', 'would', 'could', 'should', 'may', 'might', 'can']);
  return new Set(
    text.split(' ').filter(w => w.length > 1 && !stopWords.has(w))
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface DeduplicatedPost extends LeakPost {
  duplicateCount: number;
  allSources: string[];
}

export function deduplicatePosts(posts: LeakPost[], threshold = 0.55): DeduplicatedPost[] {
  const normalized = posts.map(p => ({
    post: p,
    normalizedTitle: normalizeTitle(p.title),
    tokens: tokenize(normalizeTitle(p.title)),
  }));

  const merged: boolean[] = new Array(posts.length).fill(false);
  const results: DeduplicatedPost[] = [];

  for (let i = 0; i < normalized.length; i++) {
    if (merged[i]) continue;

    const group: typeof normalized = [normalized[i]];
    merged[i] = true;

    for (let j = i + 1; j < normalized.length; j++) {
      if (merged[j]) continue;

      const sim = jaccardSimilarity(normalized[i].tokens, normalized[j].tokens);
      if (sim >= threshold) {
        group.push(normalized[j]);
        merged[j] = true;
      }
    }

    // Pick the highest-engagement post as primary
    group.sort((a, b) => b.post.score - a.post.score);
    const primary = group[0].post;
    const allSources = [...new Set(group.flatMap(g => g.post.sources))];

    results.push({
      ...primary,
      sources: allSources,
      allSources,
      duplicateCount: group.length,
    });
  }

  return results;
}
