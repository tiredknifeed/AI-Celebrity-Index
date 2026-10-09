// Fame and Momentum, exactly as defined in the workbook's SCORING METHOD
// sheet (see /methodology). Used to score new submissions the same way as
// the researched characters. scripts/build_data.py has the Python twin;
// scripts/check_scoring.ts checks both against the workbook values.

export const WEIGHTS = {
  fame: { followers: 30, engagement: 20, viral: 20, consistency: 10, longevity: 10, recognizability: 10 },
  momentum: { engagement: 35, viral: 25, frequency: 15, growth: 15, recency: 10 },
  index: { fame: 0.35, momentum: 0.3, distinctiveness: 0.2, sufficiency: 0.15 },
} as const;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** log scale: lo maps to 0, hi maps to 1. */
const logScale = (v: number | null | undefined, lo: number, hi: number) =>
  v && v > 0 ? clamp01((Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) : 0;

export interface ScoreInput {
  followers: number;
  posts: number;
  /** Average likes over the 12 most recent non-pinned posts with visible likes. */
  avgLikes12: number | null;
  /** Average likes over posts in the last 14 days. */
  avgLikes14d: number | null;
  /** Max likes on any analysed post. */
  maxLikes: number | null;
  /** Likes on the best post of the last 14 days. */
  top14dLikes: number | null;
  posts14d: number;
  posts30d: number;
  /** Days since the first visible post. */
  daysSinceFirst: number | null;
  daysSinceLast: number | null;
  /** Share of all posts that were analysed (0-1). */
  analysedShare: number;
  verified: boolean;
  /** Analyst rating 0-5; null until reviewed. */
  recognizability: number | null;
}

export interface Scores {
  fame: number;
  momentum: number;
  fameParts: Record<keyof typeof WEIGHTS.fame, number>;
  momentumParts: Record<keyof typeof WEIGHTS.momentum, number>;
}

export function score(i: ScoreInput): Scores {
  const fameParts = {
    followers: logScale(i.followers, 1e3, 1e7),
    engagement: logScale(i.avgLikes12, 100, 1e6),
    viral: logScale(i.maxLikes, 1e3, 1e7),
    consistency: clamp01(i.posts30d / 20),
    longevity: Math.max(
      i.daysSinceFirst !== null ? clamp01(i.daysSinceFirst / 730) : 0,
      i.posts > 0 ? clamp01((Math.log10(i.posts) - 1) / 2.5) : 0,
    ),
    recognizability: 0.4 * (i.verified ? 1 : 0) + 0.6 * ((i.recognizability ?? 0) / 5),
  };
  // The lower of the two averages; no posts in the window means a 14-day average of 0.
  const recent = i.posts14d === 0 ? [] : [i.avgLikes14d, i.avgLikes12].filter((v): v is number => v !== null && v > 0);
  const growthEligible = i.daysSinceFirst !== null && i.daysSinceFirst > 0 && i.daysSinceFirst <= 60 && i.analysedShare >= 0.5;
  const momentumParts = {
    engagement: recent.length ? logScale(Math.min(...recent), 100, 1e6) : 0,
    viral: logScale(i.top14dLikes, 1e3, 1e7),
    frequency: clamp01(i.posts14d / 14),
    growth: growthEligible ? logScale(i.followers / i.daysSinceFirst!, 100, 10 ** 4.5) : 0,
    recency: i.daysSinceLast === null ? 0 : i.daysSinceLast <= 3 ? 1 : clamp01((30 - i.daysSinceLast) / 27),
  };
  const sum = <K extends string>(parts: Record<K, number>, w: Record<K, number>) =>
    (Object.keys(w) as K[]).reduce((s, k) => s + parts[k] * w[k], 0);
  return {
    fame: round1(sum(fameParts, WEIGHTS.fame)),
    momentum: round1(sum(momentumParts, WEIGHTS.momentum)),
    fameParts,
    momentumParts,
  };
}

/** Index candidate score; distinctiveness 0-100, sufficiency 0-1. */
export function indexScore(fame: number, momentum: number, distinctiveness: number, sufficiency: number): number {
  const w = WEIGHTS.index;
  return round1(w.fame * fame + w.momentum * momentum + w.distinctiveness * distinctiveness + w.sufficiency * sufficiency * 100);
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}
