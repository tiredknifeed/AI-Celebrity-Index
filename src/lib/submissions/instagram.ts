// Public Instagram profile data through Apify actors (configurable in
// config.ts). Field names are read defensively because actors differ slightly.

import { config } from "./config";

export interface RawPost {
  url: string | null;
  timestamp: string | null;
  likes: number | null; // null when the owner hides likes
  comments: number | null;
  caption: string;
  pinned: boolean;
  type: string | null;
  mentions: string[];
}

export interface RawProfile {
  handle: string;
  fullName: string | null;
  biography: string;
  externalUrl: string | null;
  verified: boolean;
  private: boolean;
  followers: number;
  following: number | null;
  postsCount: number;
  posts: RawPost[];
}

type Obj = Record<string, unknown>;
const num = (...vals: unknown[]) => {
  for (const v of vals) if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
};
const str = (...vals: unknown[]) => {
  for (const v of vals) if (typeof v === "string" && v) return v;
  return null;
};

async function runActor(actor: string, input: unknown): Promise<Obj[]> {
  const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(config.apifyToken)}&timeout=120`;
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error(`Apify ${actor} failed: HTTP ${res.status}`);
  const items = (await res.json()) as unknown;
  return Array.isArray(items) ? (items as Obj[]) : [];
}

function toPost(p: Obj): RawPost {
  const likes = num(p.likesCount, p.likes, p.like_count);
  const caption = str(p.caption, (p as Obj).text) ?? "";
  const mentions = Array.isArray(p.mentions)
    ? (p.mentions as unknown[]).filter((m): m is string => typeof m === "string")
    : [...caption.matchAll(/@([A-Za-z0-9._]{2,30})/g)].map((m) => m[1]);
  return {
    url: str(p.url, p.postUrl) ?? (str(p.shortCode, p.shortcode) ? `https://www.instagram.com/p/${str(p.shortCode, p.shortcode)}/` : null),
    timestamp: str(p.timestamp, p.takenAt, p.date),
    // Instagram returns 3 or -1 as a placeholder when likes are hidden.
    likes: likes === null || likes < 0 || likes === 3 ? null : likes,
    comments: num(p.commentsCount, p.comments, p.comment_count),
    caption,
    pinned: Boolean(p.isPinned ?? p.pinned ?? false),
    type: str(p.type, p.productType),
    mentions: mentions.map((m) => m.toLowerCase()),
  };
}

export async function fetchProfile(handle: string): Promise<RawProfile> {
  const [profiles, posts] = await Promise.all([
    runActor(config.apifyProfileActor, { usernames: [handle] }),
    runActor(config.apifyPostsActor, { username: [handle], resultsLimit: config.postsLimit }),
  ]);
  const p = profiles.find((x) => String(str(x.username) ?? "").toLowerCase() === handle) ?? profiles[0];
  if (!p) throw new Error("Profile not found or not public");
  const fromProfile = Array.isArray(p.latestPosts) ? (p.latestPosts as Obj[]) : [];
  const all = [...posts, ...fromProfile].map(toPost);
  const seen = new Set<string>();
  const unique = all.filter((x) => {
    const k = x.url ?? `${x.timestamp}-${x.caption.slice(0, 20)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  unique.sort((a, b) => Date.parse(b.timestamp ?? "0") - Date.parse(a.timestamp ?? "0"));
  return {
    handle,
    fullName: str(p.fullName, p.full_name),
    biography: str(p.biography, p.bio) ?? "",
    externalUrl: str(p.externalUrl, p.external_url),
    verified: Boolean(p.verified ?? p.isVerified ?? false),
    private: Boolean(p.private ?? p.isPrivate ?? false),
    followers: num(p.followersCount, p.followers) ?? 0,
    following: num(p.followsCount, p.following),
    postsCount: num(p.postsCount, p.mediaCount) ?? unique.length,
    posts: unique,
  };
}
