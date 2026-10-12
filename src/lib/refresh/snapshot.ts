// Fresh Instagram numbers for the researched characters. /api/refresh captures
// one profile at a time into data/snapshots/<handle>.json; applySnapshots puts
// them over the build's dataset at request time (and scripts/build_data.py does
// the same at build time). Editorial fields (story, universe, ratings, first
// post, links) stay as researched; only the measured numbers and the scores
// computed from them change.

import { indexScore, score, type Scores } from "../scoring";
import type { Character, Dataset, TrajectoryPoint } from "../types";
import type { SubmissionRecord } from "../submissions/analyze";
import { heatFor, statusFor } from "../submissions/merge";

const DAY = 86_400_000;

/** The fields a snapshot replaces on a character. */
const PATCH_KEYS = [
  "followers", "following", "posts", "postsAnalysed", "lastPost", "daysSinceLastPost", "posts7d", "posts14d", "posts30d",
  "postsPerWeek", "avgLikes", "medianLikes", "avgComments", "likesHidden", "engagementRate", "avgLikes14d", "maxLikes",
  "topPost", "topPost14d", "bio", "verifiedBadge",
] as const;
type PatchKey = (typeof PATCH_KEYS)[number];

export interface Snapshot {
  schema: 1;
  handle: string;
  /** Day of the last successful capture; absent when no capture has worked yet. */
  capturedAt?: string;
  source?: string;
  patch?: Pick<Character, PatchKey>;
  scores?: Pick<Scores, "fame" | "momentum" | "fameParts" | "momentumParts"> & { index: number };
  heat?: Character["heat"];
  status?: Character["status"];
  /** Likes per post since the researched history ends, shown as the last fame-history period. */
  period?: TrajectoryPoint | null;
  /** Last capture attempt, successful or not. */
  attempt?: { date: string; ok: boolean; error?: string };
  /** Apify runs started for today's capture and not collected yet. */
  pending?: { date: string; profile: { id: string; dataset: string }; posts: { id: string; dataset: string } };
}

const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;

/** Builds the snapshot for a researched character from a fresh profile analysis. */
export function buildSnapshot(c: Character, rec: SubmissionRecord, source: string): Snapshot {
  const m = rec.metrics;
  const p = rec.profile;
  const day = rec.capturedAt;
  // the researched peak may be older than the posts fetched now
  const keepOldPeak = (c.maxLikes ?? 0) > (m.maxLikes ?? 0);
  const maxLikes = keepOldPeak ? c.maxLikes : m.maxLikes;
  const topPost = keepOldPeak
    ? c.topPost
    : m.topPost?.url
      ? { url: m.topPost.url, date: m.topPost.date, likes: m.topPost.likes, comments: m.topPost.comments, caption: m.topPost.caption }
      : c.topPost;
  const daysSinceFirst = c.firstPost ? Math.max(0, Math.round((Date.parse(day) - Date.parse(c.firstPost)) / DAY)) : m.daysSinceFirst;
  const s = score({
    followers: p.followers,
    posts: p.postsCount,
    avgLikes12: m.avgLikes12,
    avgLikes14d: m.avgLikes14d,
    maxLikes,
    top14dLikes: m.top14dPost?.likes ?? null,
    posts14d: m.posts14d,
    posts30d: m.posts30d,
    daysSinceFirst,
    daysSinceLast: m.daysSinceLast,
    analysedShare: p.postsCount ? m.postsAnalysed / p.postsCount : 0,
    verified: p.verified,
    recognizability: c.scores.recognizabilityInput ?? null,
  });
  const index = indexScore(s.fame, s.momentum, c.scores.distinctiveness ?? 0, c.scores.sufficiency ?? 0);

  // posts after the researched history, as one more fame-history period
  const lastEnd = c.trajectory.filter((t) => !t.live).at(-1)?.end ?? null;
  const newer = rec.posts
    .filter((x) => x.timestamp && x.likes !== null && (!lastEnd || x.timestamp.slice(0, 10) > lastEnd))
    .map((x) => ({ d: x.timestamp!.slice(0, 10), likes: x.likes! }))
    .sort((a, b) => (a.d < b.d ? -1 : 1));
  const period: TrajectoryPoint | null = newer.length
    ? {
        start: newer[0].d,
        end: newer[newer.length - 1].d,
        posts: newer.length,
        avgLikes: Math.round(newer.reduce((a, x) => a + x.likes, 0) / newer.length),
        label: "Latest",
        live: true,
      }
    : null;

  return {
    schema: 1,
    handle: c.handle,
    capturedAt: day,
    source,
    patch: {
      followers: p.followers,
      following: p.following,
      posts: p.postsCount,
      postsAnalysed: m.postsAnalysed,
      lastPost: m.lastPost,
      daysSinceLastPost: m.daysSinceLast,
      posts7d: m.posts7d,
      posts14d: m.posts14d,
      posts30d: m.posts30d,
      postsPerWeek: round(m.posts14d / 2, 1),
      avgLikes: m.avgLikes12,
      medianLikes: m.medianLikes12,
      avgComments: m.avgComments12,
      likesHidden: m.likesHidden12,
      engagementRate: m.engagementRate,
      avgLikes14d: m.avgLikes14d,
      maxLikes,
      topPost,
      topPost14d: m.top14dPost?.url ? { url: m.top14dPost.url, date: m.top14dPost.date, likes: m.top14dPost.likes } : null,
      bio: p.biography || c.bio,
      verifiedBadge: p.verified,
    } as Pick<Character, PatchKey>,
    scores: { fame: s.fame, momentum: s.momentum, index, fameParts: s.fameParts, momentumParts: s.momentumParts },
    heat: heatFor(s.momentum),
    status: statusFor(m.daysSinceLast, day),
    period,
    attempt: { date: day, ok: true },
  };
}

/**
 * Puts the snapshots over the researched characters (idempotent: applying the
 * same snapshots twice gives the same dataset) and moves the index date to the
 * newest capture. Ranks are recomputed by mergeSubmissions, which runs after.
 */
export function applySnapshots(base: Dataset, snaps: Snapshot[]): Dataset {
  const ds = structuredClone(base) as Dataset;
  const byHandle = new Map(ds.characters.map((c) => [c.handle, c]));
  let asOf = ds.meta.asOf;
  for (const s of [...snaps].sort((a, b) => (a.handle < b.handle ? -1 : 1))) {
    const c = byHandle.get(s.handle);
    if (!c || c.group === "SUBMITTED" || !s.patch || !s.scores || !s.capturedAt) continue;
    Object.assign(c, s.patch);
    c.scores = { ...c.scores, ...s.scores };
    if (s.heat) c.heat = s.heat;
    if (s.status) c.status = s.status;
    c.trajectory = [...c.trajectory.filter((t) => !t.live), ...(s.period ? [{ ...s.period, live: true }] : [])];
    c.refreshed = { capturedAt: s.capturedAt, source: s.source ?? null };
    if (s.capturedAt > asOf) asOf = s.capturedAt;
  }
  ds.meta = { ...ds.meta, asOf };
  return ds;
}
