// TypeScript twin of the submission merge in scripts/build_data.py
// (submission_character + ranks + edges + universes). Used at request time to
// put user submissions on the site without a rebuild; the Python build does the
// same at build time, so both produce the same dataset.

import { score } from "../scoring";
import type { Character, Dataset, Edge, Universe } from "../types";
import type { SubmissionRecord } from "./analyze";

const DAY = 86_400_000;
const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;

export function slugify(name: string) {
  return name
    .replace(/\(.*?\)/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function displayName(name: string) {
  return name.replace(/\s*\((parody account|copycat)\)\s*/g, "").trim();
}

export function heatFor(m: number | null): Character["heat"] {
  if (m === null) return "DORMANT";
  if (m >= 80) return "ON FIRE";
  if (m >= 68) return "HOT";
  if (m >= 58) return "RISING";
  if (m >= 45) return "STEADY";
  if (m >= 25) return "COOLING";
  return "DORMANT";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "09 Oct 2026", as in build_data.py */
const captureDay = (iso: string) => `${iso.slice(8, 10)} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

function statusFor(days: number | null, asof: string): Character["status"] {
  if (days === null) return { code: "UNKNOWN", basis: "No dated post captured" };
  if (days > 30) return { code: "DORMANT", basis: `Last post ${days} days before capture` };
  if (days === 0) return { code: "ACTIVE_TODAY", basis: `Posted on capture day (${captureDay(asof)})` };
  if (days <= 3) return { code: "POSTING", basis: `Last post ${days}d before capture` };
  if (days <= 14) return { code: "STABLE", basis: `Last post ${days}d before capture` };
  return { code: "COOLING", basis: `Last post ${days}d before capture` };
}

/** A record the build would merge: included and every analyst rating filled. */
export function isMergeable(rec: SubmissionRecord) {
  const rv = rec.review;
  const d = rv?.distinct ?? ({} as SubmissionRecord["review"]["distinct"]);
  return !!rv?.include && [rv.recognizability, d.visual, d.personality, d.lore, d.crossCharacter].every((v) => v !== null && v !== undefined);
}

function submissionCharacter(rec: SubmissionRecord, id: number, asof: string, universes: Set<string>): Character {
  const m = rec.metrics;
  const p = rec.profile;
  const rv = rec.review;
  const d = rv.distinct as Record<"visual" | "personality" | "lore" | "crossCharacter", number>;
  // age the capture to the index date (never below zero)
  const shift = Math.round((Date.parse(asof) - Date.parse(rec.capturedAt)) / DAY);
  const daysFirst = m.daysSinceFirst === null ? null : Math.max(0, m.daysSinceFirst + shift);
  const daysLast = m.daysSinceLast === null ? null : Math.max(0, m.daysSinceLast + shift);
  const s = score({
    followers: p.followers,
    posts: p.postsCount,
    avgLikes12: m.avgLikes12,
    avgLikes14d: m.avgLikes14d,
    maxLikes: m.maxLikes,
    top14dLikes: m.top14dPost?.likes ?? null,
    posts14d: m.posts14d,
    posts30d: m.posts30d,
    daysSinceFirst: daysFirst,
    daysSinceLast: daysLast,
    analysedShare: p.postsCount ? m.postsAnalysed / p.postsCount : 0,
    verified: p.verified,
    recognizability: rv.recognizability,
  });
  const distinct = round(((d.visual + d.personality + d.lore + d.crossCharacter) / 20) * 100, 1);
  const flags = rec.sufficiency;
  const vals = Object.values(flags);
  const suff = round(vals.reduce((a, v) => a + ({ YES: 1, PARTIAL: 0.5, NO: 0 } as const)[v], 0) / vals.length, 2);
  const index = round(0.35 * s.fame + 0.3 * s.momentum + 0.2 * distinct + 0.15 * suff * 100, 1);
  const name = rv.name || p.fullName || rec.handle;
  const tok = rec.token;
  const top = m.topPost;
  const top14 = m.top14dPost;
  const timeline: Character["timeline"] = [];
  if (m.firstPost)
    timeline.push({ date: m.firstPost, label: "First analysed post", kind: "debut", value: null, status: "OBSERVED", note: m.fullHistory ? "Full history" : "Oldest of the analysed posts" } as Character["timeline"][number]);
  if (top?.date)
    timeline.push({ date: top.date, label: top.likes ? `Peak post: ${top.likes.toLocaleString("en-US")} likes` : "Peak post", kind: "peak", value: top.likes, status: "OBSERVED", url: top.url } as Character["timeline"][number]);
  if (m.lastPost && !timeline.some((e) => e.date === m.lastPost))
    timeline.push({ date: m.lastPost, label: "Latest post captured", kind: "moment", value: null, status: "OBSERVED" } as Character["timeline"][number]);
  timeline.sort((a, b) => ((a.date ?? "") < (b.date ?? "") ? -1 : 1));
  const auto = !!(rv as { auto?: boolean }).auto;

  return {
    id,
    slug: slugify(name),
    name: displayName(name),
    fullName: name,
    handle: rec.handle,
    profileUrl: rec.profileUrl,
    group: "SUBMITTED",
    inclusion: "INCLUDED",
    caveat: null,
    characterType: rv.characterType || "",
    origin: "Community submission",
    kind: "human",
    virtual: false,
    universe: rv.universe && universes.has(rv.universe) ? rv.universe : "independents",
    universeNote: rv.universe,
    identity: "COMMUNITY",
    identityFlag: flags["VERIFIED IDENTITY"],
    verifiedBadge: p.verified,
    parodyOf: rv.parodyOf,
    disambiguation: null,
    copycats: null,
    followers: p.followers,
    following: p.following,
    posts: p.postsCount,
    postsAnalysed: m.postsAnalysed,
    fullHistory: m.fullHistory ? "YES" : "PARTIAL",
    firstPost: m.firstPost,
    firstPostBasis: "Oldest analysed post",
    lastPost: m.lastPost,
    daysSinceLastPost: daysLast,
    posts7d: m.posts7d,
    posts14d: m.posts14d,
    posts30d: m.posts30d,
    postsPerWeek: round(m.posts14d / 2, 1),
    avgLikes: m.avgLikes12,
    medianLikes: m.medianLikes12,
    avgComments: m.avgComments12,
    likesHidden: m.likesHidden12,
    engagementRate: m.engagementRate,
    engagementLevel: null,
    avgLikes14d: m.avgLikes14d,
    avgComments14d: null,
    maxLikes: m.maxLikes,
    topPost: top?.url ? { url: top.url, date: top.date, likes: top.likes, comments: top.comments, caption: top.caption } : null,
    topPost14d: top14?.url ? { url: top14.url, date: top14.date, likes: top14.likes } : null,
    topPostNote: null,
    bio: p.biography,
    linkInBio: p.externalUrl,
    token: {
      status: tok.verification !== "NONE" ? "IG_OBSERVED" : "NONE",
      verification: tok.verification,
      ticker: tok.ticker,
      contract: tok.contract,
      chain: tok.verification !== "NONE" ? "SOLANA" : null,
      contractInBio: !!tok.contract,
      note: tok.evidence,
      url: tok.url,
      reported: null,
      userSupplied: null,
      contractSource: tok.contract ? "PROFILE" : null,
    },
    related: null,
    personality: null,
    visualStyle: null,
    contentFormat: null,
    notes: rv.notes || null,
    why: null,
    scores: {
      fame: s.fame,
      momentum: s.momentum,
      distinctiveness: distinct,
      sufficiency: suff,
      index,
      fameParts: s.fameParts,
      momentumParts: s.momentumParts,
      distinctParts: d,
      recognizabilityInput: rv.recognizability,
    },
    heat: heatFor(s.momentum),
    status: statusFor(daysLast, asof),
    phase: null,
    debut: { date: m.firstPost, basis: "Oldest analysed post", url: null },
    peak: top ? { date: top.date, likes: top.likes, url: top.url } : null,
    trajectory: [],
    timeline,
    evidence: [],
    realPeopleTagged: [],
    brandsTagged: [],
    suggestedNeighbours: null,
    outLinks: rec.links.map((l) => ({ handle: l.handle, count: l.count, note: "tag/mention" })),
    inLinks: [],
    externalLinks: [],
    sufficiency: { flags, basis: auto ? "Automated checks on the submitted profile" : "Automated checks on the submitted profile, confirmed in review" },
    submission: { capturedAt: rec.capturedAt, source: rec.source, auto },
    sources: [],
    ranks: null,
    degree: 0,
  } as unknown as Character;
}

/**
 * Replaces the build's submitted characters with `records`, then recomputes
 * ranks, submission edges, SAME_UNIVERSE edges, degrees and universe members
 * exactly like scripts/build_data.py.
 */
export function mergeSubmissions(base: Dataset, records: SubmissionRecord[]): Dataset {
  const ds = structuredClone(base) as Dataset;
  const oldSubmitted = new Set(ds.characters.filter((c) => c.group === "SUBMITTED").map((c) => c.handle));
  let characters = ds.characters.filter((c) => c.group !== "SUBMITTED");
  const universeIds = new Set(ds.universes.map((u) => u.id));
  const existing = new Set([...characters.map((c) => c.handle), ...ds.excluded.map((e) => e.handle)]);
  for (const rec of [...records].sort((a, b) => (a.handle < b.handle ? -1 : 1))) {
    if (!isMergeable(rec) || existing.has(rec.handle)) continue;
    const id = Math.max(...characters.map((c) => c.id)) + 1;
    characters.push(submissionCharacter(rec, id, ds.meta.asOf, universeIds));
    existing.add(rec.handle);
  }
  // one slug per character: a submission whose slug collides gets the handle as suffix
  const slugs = new Set<string>();
  characters = characters.map((c) => {
    if (slugs.has(c.slug)) c = { ...c, slug: `${c.slug}-${slugify(c.handle)}` };
    slugs.add(c.slug);
    return c;
  });

  const included = characters.filter((c) => c.inclusion === "INCLUDED");
  for (const c of characters) c.ranks = null;
  for (const key of ["index", "fame", "momentum", "distinctiveness"] as const) {
    [...included]
      .sort((a, b) => (b.scores[key] ?? 0) - (a.scores[key] ?? 0) || a.id - b.id)
      .forEach((c, i) => {
        c.ranks = { ...(c.ranks ?? { index: 0, fame: 0, momentum: 0, distinctiveness: 0 }), [key]: i + 1 };
      });
  }

  // edges: workbook edges stay; submission and SAME_UNIVERSE edges are rebuilt
  const nodes = new Set(characters.map((c) => c.handle));
  const edges = new Map<string, Edge>();
  for (const e of ds.edges) {
    if (e.type === "SAME_UNIVERSE" || oldSubmitted.has(e.source) || oldSubmitted.has(e.target)) continue;
    edges.set(`${e.source}|${e.target}`, e);
  }
  for (const c of characters) {
    if (c.group !== "SUBMITTED") continue;
    for (const l of c.outLinks) {
      const k = `${c.handle}|${l.handle}`;
      if (nodes.has(l.handle) && !edges.has(k))
        edges.set(k, {
          source: c.handle,
          target: l.handle,
          type: "MENTION",
          count: l.count,
          note: "Tag/mention in submitted profile",
          raw: "tag/mention",
          evidence: [],
          observedOn: (c as unknown as { submission: { capturedAt: string } }).submission.capturedAt,
          status: "OBSERVED",
        } as Edge);
    }
  }
  const byHandle = new Map(characters.map((c) => [c.handle, c]));
  for (const u of ds.universes) {
    const members = included.filter((c) => c.universe === u.id);
    if (members.length < 2 || u.id === "independents") continue;
    const inU = new Set(members.map((m) => m.handle));
    const touches = (h: string, e: Edge) => (e.source === h || e.target === h) && inU.has(e.source) && inU.has(e.target);
    const deg = (c: Character) => [...edges.values()].filter((e) => touches(c.handle, e)).length;
    const hub = members.reduce((best, c) => {
      const a = [deg(c), c.scores.fame ?? 0];
      const b = [deg(best), best.scores.fame ?? 0];
      return a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]) ? c : best;
    });
    for (const m of members) {
      if (m === hub) continue;
      if ([...edges.values()].some((e) => touches(m.handle, e))) continue;
      edges.set(`${m.handle}|${hub.handle}`, {
        source: m.handle,
        target: hub.handle,
        type: "SAME_UNIVERSE",
        count: 1,
        note: `Same universe (${u.name}) - no direct tag observed`,
        raw: null,
        evidence: [],
        status: "INFERRED",
      } as Edge);
    }
  }
  const edgeList = [...edges.values()];
  const degree = new Map<string, number>();
  for (const e of edgeList) {
    if (e.type === "SAME_UNIVERSE") continue;
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }
  for (const c of characters) c.degree = degree.get(c.handle) ?? 0;

  const universes: Universe[] = [];
  for (const u of ds.universes) {
    const members = included.filter((c) => c.universe === u.id).sort((a, b) => a.ranks!.index - b.ranks!.index);
    if (!members.length) continue;
    const hubEdge = edgeList.find((e) => e.type === "SAME_UNIVERSE" && byHandle.get(e.target)?.universe === u.id);
    const hub = hubEdge
      ? byHandle.get(hubEdge.target)!
      : members.reduce((best, c) => (c.degree > best.degree || (c.degree === best.degree && (c.scores.fame ?? 0) > (best.scores.fame ?? 0)) ? c : best));
    universes.push({ ...u, members: members.map((m) => m.slug), hub: hub.slug });
  }

  ds.characters = characters;
  ds.edges = edgeList;
  ds.universes = universes;
  ds.meta = { ...ds.meta, counts: { ...ds.meta.counts, included: included.length } };
  return ds;
}
