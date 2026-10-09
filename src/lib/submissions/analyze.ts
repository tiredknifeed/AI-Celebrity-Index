// Turns a raw Instagram profile into a submission record: the same metrics
// the research workbook defines, provisional scores, token signals and
// observed links to characters already in the index.

import { score, type Scores } from "../scoring";
import type { RawPost, RawProfile } from "./instagram";
import { profileUrl } from "./handle";

const DAY = 86_400_000;

export interface SubmissionRecord {
  schema: 1;
  handle: string;
  profileUrl: string;
  submittedAt: string;
  capturedAt: string;
  source: string;
  payment: { provider: "stripe"; session: string; amount: number; currency: string };
  profile: Omit<RawProfile, "posts" | "handle">;
  posts: RawPost[];
  metrics: {
    postsAnalysed: number;
    fullHistory: boolean;
    firstPost: string | null;
    lastPost: string | null;
    daysSinceFirst: number | null;
    daysSinceLast: number | null;
    posts7d: number;
    posts14d: number;
    posts30d: number;
    avgLikes12: number | null;
    medianLikes12: number | null;
    avgComments12: number | null;
    likesHidden12: number;
    avgLikes14d: number | null;
    maxLikes: number | null;
    topPost: { url: string | null; date: string | null; likes: number | null; comments: number | null; caption: string } | null;
    top14dPost: { url: string | null; date: string | null; likes: number | null } | null;
    engagementRate: number | null;
  };
  scores: Scores & { provisional: true; note: string };
  token: {
    verification: "CONTRACT" | "PROFILE" | "NONE";
    ticker: string | null;
    contract: string | null;
    url: string | null;
    evidence: string | null;
  };
  links: { handle: string; count: number }[];
  sufficiency: Record<"VERIFIED IDENTITY" | "FAME SCORE" | "LIVE STATUS" | "CAREER TIMELINE" | "SOCIAL GRAPH", "YES" | "PARTIAL" | "NO">;
  review: {
    include: boolean;
    name: string | null;
    characterType: string | null;
    universe: string | null;
    parodyOf: string | null;
    recognizability: number | null;
    distinct: { visual: number | null; personality: number | null; lore: number | null; crossCharacter: number | null };
    notes: string;
  };
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function tokenSignals(p: RawProfile): SubmissionRecord["token"] {
  const text = `${p.biography}\n${p.externalUrl ?? ""}`;
  const ca = text.match(/\bCA\s*[:\-]?\s*([1-9A-HJ-NP-Za-km-z]{32,48})/i)?.[1] ?? text.match(/pump\.fun\/(?:coin\/)?([1-9A-HJ-NP-Za-km-z]{32,48})/i)?.[1] ?? null;
  const ticker = p.biography.match(/\$[A-Za-z][A-Za-z0-9]{1,14}\b/)?.[0] ?? null;
  const link = text.match(/(?:https?:\/\/)?(?:join\.)?pump\.fun\/[^\s]+/i)?.[0] ?? null;
  if (ca) return { verification: "CONTRACT", ticker, contract: ca, url: `https://pump.fun/coin/${ca}`, evidence: "Contract address in bio" };
  if (ticker || link)
    return {
      verification: "PROFILE",
      ticker,
      contract: null,
      url: link ? (link.startsWith("http") ? link : `https://${link}`) : null,
      evidence: ticker ? "Ticker in bio" : "pump.fun link in bio",
    };
  return { verification: "NONE", ticker: null, contract: null, url: null, evidence: null };
}

export function analyze(
  raw: RawProfile,
  opts: { session: string; amount: number; currency: string; knownHandles: string[]; now?: Date; source: string },
): SubmissionRecord {
  const now = opts.now ?? new Date();
  const t = now.getTime();
  const dated = raw.posts.filter((p) => p.timestamp);
  const ageDays = (p: RawPost) => (t - Date.parse(p.timestamp!)) / DAY;
  const unpinned = dated.filter((p) => !p.pinned);
  const last12 = unpinned.slice(0, 12);
  const likes12 = last12.map((p) => p.likes).filter((v): v is number => v !== null);
  const comments12 = last12.map((p) => p.comments).filter((v): v is number => v !== null);
  const in14 = unpinned.filter((p) => ageDays(p) <= 14);
  const likes14 = in14.map((p) => p.likes).filter((v): v is number => v !== null);
  const withLikes = dated.filter((p) => p.likes !== null);
  const top = withLikes.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))[0] ?? null;
  const top14 = [...in14].filter((p) => p.likes !== null).sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))[0] ?? null;
  const oldest = dated.length ? dated.reduce((a, b) => (Date.parse(a.timestamp!) < Date.parse(b.timestamp!) ? a : b)) : null;
  const newest = dated.length ? dated.reduce((a, b) => (Date.parse(a.timestamp!) > Date.parse(b.timestamp!) ? a : b)) : null;
  const daysSinceFirst = oldest ? Math.round(ageDays(oldest)) : null;
  const daysSinceLast = newest ? Math.round(ageDays(newest)) : null;
  const avgLikes12 = avg(likes12);
  const avgComments12 = avg(comments12);

  const metrics: SubmissionRecord["metrics"] = {
    postsAnalysed: dated.length,
    fullHistory: dated.length >= raw.postsCount,
    firstPost: oldest?.timestamp?.slice(0, 10) ?? null,
    lastPost: newest?.timestamp?.slice(0, 10) ?? null,
    daysSinceFirst,
    daysSinceLast,
    posts7d: dated.filter((p) => ageDays(p) <= 7).length,
    posts14d: in14.length,
    posts30d: unpinned.filter((p) => ageDays(p) <= 30).length,
    avgLikes12: avgLikes12 === null ? null : Math.round(avgLikes12),
    medianLikes12: median(likes12),
    avgComments12: avgComments12 === null ? null : Math.round(avgComments12),
    likesHidden12: last12.length - likes12.length,
    avgLikes14d: likes14.length ? Math.round(avg(likes14)!) : null,
    maxLikes: top?.likes ?? null,
    topPost: top ? { url: top.url, date: top.timestamp?.slice(0, 10) ?? null, likes: top.likes, comments: top.comments, caption: top.caption.slice(0, 140) } : null,
    top14dPost: top14 ? { url: top14.url, date: top14.timestamp?.slice(0, 10) ?? null, likes: top14.likes } : null,
    engagementRate: raw.followers && avgLikes12 !== null ? (avgLikes12 + (avgComments12 ?? 0)) / raw.followers : null,
  };

  const s = score({
    followers: raw.followers,
    posts: raw.postsCount,
    avgLikes12: metrics.avgLikes12,
    avgLikes14d: metrics.avgLikes14d,
    maxLikes: metrics.maxLikes,
    top14dLikes: metrics.top14dPost?.likes ?? null,
    posts14d: metrics.posts14d,
    posts30d: metrics.posts30d,
    daysSinceFirst,
    daysSinceLast,
    analysedShare: raw.postsCount ? dated.length / raw.postsCount : 0,
    verified: raw.verified,
    recognizability: null,
  });

  const known = new Set(opts.knownHandles.map((h) => h.toLowerCase()));
  const counts = new Map<string, number>();
  for (const p of dated) for (const m of new Set(p.mentions)) if (known.has(m) && m !== raw.handle) counts.set(m, (counts.get(m) ?? 0) + 1);
  const links = [...counts.entries()].map(([handle, count]) => ({ handle, count })).sort((a, b) => b.count - a.count);

  const { posts, handle, ...profile } = raw;
  return {
    schema: 1,
    handle,
    profileUrl: profileUrl(handle),
    submittedAt: now.toISOString(),
    capturedAt: now.toISOString().slice(0, 10),
    source: opts.source,
    payment: { provider: "stripe", session: opts.session, amount: opts.amount, currency: opts.currency },
    profile,
    posts: posts.slice(0, 60),
    metrics,
    scores: { ...s, provisional: true, note: "Recognizability, distinctiveness and the index score are set by an analyst during review." },
    token: tokenSignals(raw),
    links,
    sufficiency: {
      "VERIFIED IDENTITY": raw.verified ? "YES" : "PARTIAL",
      "FAME SCORE": likes12.length >= 12 ? "YES" : likes12.length >= 4 ? "PARTIAL" : "NO",
      "LIVE STATUS": daysSinceLast !== null && daysSinceLast <= 14 ? "YES" : "NO",
      "CAREER TIMELINE": metrics.fullHistory ? "YES" : "PARTIAL",
      "SOCIAL GRAPH": links.length >= 3 ? "YES" : links.length ? "PARTIAL" : "NO",
    },
    review: {
      include: false,
      name: raw.fullName,
      characterType: null,
      universe: null,
      parodyOf: null,
      recognizability: null,
      distinct: { visual: null, personality: null, lore: null, crossCharacter: null },
      notes: "",
    },
  };
}
