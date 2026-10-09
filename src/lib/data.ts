import raw from "@/data/generated/index.json";
import type { Character, Dataset, Edge, EdgeType, Ranked, Source, Universe } from "./types";

// The JSON is produced by scripts/build_data.py. Swap this import for a fetch
// to move the index onto a backend; everything below works on the same shape.
export const dataset = raw as unknown as Dataset;

export const meta = dataset.meta;
export const AS_OF = dataset.meta.asOf;

export const characters: Character[] = dataset.characters;
export const edges: Edge[] = dataset.edges;
export const universes: Universe[] = dataset.universes;
export const sources: Source[] = dataset.sources;

/** INCLUDED characters, ranked by the index score. */
export const ranked: Ranked[] = characters
  .filter((c): c is Ranked => c.inclusion === "INCLUDED" && c.ranks !== null)
  .sort((a, b) => a.ranks.index - b.ranks.index);

export const watchlist: Character[] = characters.filter((c) => c.inclusion === "WATCHLIST");

const bySlugMap = new Map(characters.map((c) => [c.slug, c]));
const byHandleMap = new Map(characters.map((c) => [c.handle, c]));

export function bySlug(slug: string): Character | undefined {
  return bySlugMap.get(slug);
}

export function byHandle(handle: string): Character | undefined {
  return byHandleMap.get(handle);
}

export function universeOf(id: string): Universe | undefined {
  return universes.find((u) => u.id === id);
}

export type Metric = "index" | "fame" | "momentum";

export function sortBy(metric: Metric): Ranked[] {
  return [...ranked].sort((a, b) => a.ranks[metric] - b.ranks[metric]);
}

export const top = ranked[0];

/** Characters with the strongest current Momentum. */
export const breakout: Ranked[] = sortBy("momentum");

// ------------------------------------------------------------------ relationships

export interface Relationship {
  other: Character;
  type: EdgeType;
  direction: "out" | "in";
  count: number;
  note: string | null;
  evidence: string[];
  status: Edge["status"];
}

export function relationshipsOf(c: Character): Relationship[] {
  const out: Relationship[] = [];
  for (const e of edges) {
    if (e.source === c.handle || e.target === c.handle) {
      const otherHandle = e.source === c.handle ? e.target : e.source;
      const other = byHandle(otherHandle);
      if (!other) continue;
      out.push({
        other,
        type: e.type,
        direction: e.source === c.handle ? "out" : "in",
        count: e.count,
        note: e.note,
        evidence: e.evidence,
        status: e.status,
      });
    }
  }
  const order: EdgeType[] = ["RIVAL", "STORYLINE", "COLLAB", "MENTION", "SAME_UNIVERSE"];
  return out.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type) || b.count - a.count);
}

export function sourcesOf(c: Character): Source[] {
  return sources.filter((s) => c.sources.includes(s.n));
}

// ------------------------------------------------------------------ rivalries

export interface Rivalry {
  a: Ranked;
  b: Ranked;
  note: string | null;
  count: number;
  evidence: string[];
}

/** Pairs joined by a RIVAL edge in the observed social graph. */
export const rivalries: Rivalry[] = (() => {
  const seen = new Map<string, Rivalry>();
  for (const e of edges) {
    if (e.type !== "RIVAL") continue;
    const a = byHandle(e.source);
    const b = byHandle(e.target);
    if (!a?.ranks || !b?.ranks) continue;
    const key = [a.handle, b.handle].sort().join("|");
    const prev = seen.get(key);
    if (prev) {
      prev.count += e.count;
      prev.evidence.push(...e.evidence);
      continue;
    }
    seen.set(key, { a: a as Ranked, b: b as Ranked, note: e.note, count: e.count, evidence: [...e.evidence] });
  }
  return [...seen.values()].sort(
    (x, y) => x.a.ranks.index + x.b.ranks.index - (y.a.ranks.index + y.b.ranks.index),
  );
})();

// ------------------------------------------------------------------ editorial

export interface Story {
  id: string;
  title: string;
  kicker: string;
  items: { c: Ranked; stat: string; label: string }[];
  basis: string;
}

const WEEK_START = new Date(Date.parse(AS_OF) - 7 * 86_400_000).toISOString().slice(0, 10);

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/0$/, "")}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
}

export const stories: Story[] = (() => {
  const list: Story[] = [];

  const thisWeek = ranked
    .filter((c) => c.topPost14d?.date && c.topPost14d.date >= WEEK_START && c.topPost14d.likes)
    .sort((a, b) => (b.topPost14d!.likes ?? 0) - (a.topPost14d!.likes ?? 0))
    .slice(0, 3);
  list.push({
    id: "biggest-this-week",
    title: "Biggest this week",
    kicker: "Top post since " + WEEK_START.slice(5).replace("-", "/"),
    items: thisWeek.map((c) => ({ c, stat: fmt(c.topPost14d!.likes!), label: "likes on one post" })),
    basis: "Largest single post dated in the 7 days before capture (OBSERVED).",
  });

  const rising = [...ranked]
    .sort((a, b) => b.scores.momentum - b.scores.fame - (a.scores.momentum - a.scores.fame))
    .slice(0, 3);
  list.push({
    id: "fastest-rising",
    title: "Fastest rising",
    kicker: "Momentum running ahead of Fame",
    items: rising.map((c) => ({
      c,
      stat: `+${(c.scores.momentum - c.scores.fame).toFixed(1)}`,
      label: "Momentum over Fame",
    })),
    basis: "Momentum Score minus Fame Score: attention now versus established size (INFERRED).",
  });

  const connected = [...ranked].sort((a, b) => b.degree - a.degree).slice(0, 3);
  list.push({
    id: "most-connected",
    title: "Most connected",
    kicker: "Hubs of the universe",
    items: connected.map((c) => ({ c, stat: `${c.degree}`, label: "character links" })),
    basis: "Distinct tag/mention links to other AI characters, in or out (OBSERVED).",
  });

  const falls = ranked
    .filter((c) => c.trajectory.length >= 2)
    .map((c) => {
      const first = c.trajectory[0].avgLikes;
      const last = c.trajectory[c.trajectory.length - 1].avgLikes;
      return { c, drop: last / first - 1, first, last };
    })
    .filter((x) => x.drop < 0)
    .sort((a, b) => a.drop - b.drop)
    .slice(0, 3);
  list.push({
    id: "biggest-fall",
    title: "Biggest fall",
    kicker: "From the first period to the latest",
    items: falls.map((x) => ({
      c: x.c,
      stat: `${Math.round(x.drop * 100)}%`,
      label: `${fmt(x.first)} → ${fmt(x.last)} avg likes`,
    })),
    basis: "Change in average likes per post between the first and latest tracked period (OBSERVED).",
  });

  const arrivals = ranked
    .filter((c) => c.debut.date && (c.debut.basis ?? "").toLowerCase().includes("full history"))
    .sort((a, b) => (b.debut.date! > a.debut.date! ? 1 : -1))
    .slice(0, 3);
  list.push({
    id: "new-arrivals",
    title: "New arrivals",
    kicker: "Most recent debuts",
    items: arrivals.map((c) => ({ c, stat: c.debut.date!.slice(5).replace("-", "/"), label: "debut" })),
    basis: "First post, where the full post history was loaded (OBSERVED).",
  });

  const viral = [...ranked].sort((a, b) => (b.maxLikes ?? 0) - (a.maxLikes ?? 0)).slice(0, 3);
  list.push({
    id: "most-viral",
    title: "Most viral",
    kicker: "Biggest single post ever captured",
    items: viral.map((c) => ({ c, stat: fmt(c.maxLikes ?? 0), label: "likes, peak post" })),
    basis: "Maximum likes on any analysed post (OBSERVED).",
  });

  return list;
})();

export { HEAT_ORDER, STATUS_LABEL, EDGE_LABEL, EDGE_COLOR } from "./labels";

// ------------------------------------------------------------------ cards

/** The slice of a character that cards and client lists need. */
export interface CardData {
  slug: string;
  name: string;
  handle: string;
  rank: number | null;
  fameRank: number | null;
  momentumRank: number | null;
  fame: number;
  momentum: number;
  index: number;
  followers: number;
  heat: Character["heat"];
  status: Character["status"]["code"];
  identity: Character["identity"];
  universe: string;
  universeName: string | null;
  kind: Character["kind"];
  virtual: boolean;
  verified: boolean;
  tokenized: boolean;
  crypto: boolean;
  daysSinceLastPost: number | null;
  maxLikes: number | null;
  characterType: string;
  degree: number;
  token: TokenCard;
}

/** What a card may show about a token. Only verified facts. */
export interface TokenCard {
  verification: Character["token"]["verification"];
  ticker: string | null;
  contract: string | null;
  /** EDITOR when the contract was confirmed by the editors rather than seen in the bio. */
  contractSource: "PROFILE" | "EDITOR" | null;
  url: string | null;
  chain: string | null;
  /** Off-profile mention, shown only as "unverified". */
  mention: string | null;
}

export function tokenCard(c: Character): TokenCard {
  const t = c.token;
  const mention = t.reported?.match(/\$[A-Za-z][A-Za-z0-9]*/)?.[0] ?? t.userSupplied ?? null;
  return {
    verification: t.verification,
    ticker: t.verification === "CONTRACT" || t.verification === "PROFILE" ? t.ticker : null,
    contract: t.verification === "CONTRACT" ? t.contract : null,
    contractSource: t.verification === "CONTRACT" ? t.contractSource : null,
    url: t.verification === "CONTRACT" || t.verification === "PROFILE" ? t.url : null,
    chain: t.chain,
    mention: t.verification === "UNVERIFIED" ? mention : null,
  };
}

export function toCard(c: Character): CardData {
  const u = universeOf(c.universe);
  return {
    slug: c.slug,
    name: c.name,
    handle: c.handle,
    rank: c.ranks?.index ?? null,
    fameRank: c.ranks?.fame ?? null,
    momentumRank: c.ranks?.momentum ?? null,
    fame: c.scores.fame,
    momentum: c.scores.momentum,
    index: c.scores.index,
    followers: c.followers,
    heat: c.heat,
    status: c.status.code,
    identity: c.identity,
    universe: c.universe,
    universeName: u && u.id !== "independents" ? u.name : null,
    kind: c.kind,
    virtual: c.virtual,
    verified: c.verifiedBadge,
    tokenized: c.token.status === "IG_OBSERVED",
    crypto: c.token.status === "IG_OBSERVED" || !!c.token.reported,
    daysSinceLastPost: c.daysSinceLastPost,
    maxLikes: c.maxLikes,
    characterType: c.characterType,
    degree: c.degree,
    token: tokenCard(c),
  };
}

// ------------------------------------------------------------------ career arc

export interface ArcStep {
  date: string | null;
  label: string;
  value: number | null;
  kind: Character["timeline"][number]["kind"] | "now";
  stage: string;
  status: Character["timeline"][number]["status"];
  url?: string | null;
  note?: string | null;
}

/** Turns raw timeline events into the editorial career arc. */
export function careerArc(c: Character): ArcStep[] {
  const steps: ArcStep[] = [];
  let sawViral = false;
  for (const e of c.timeline) {
    let stage: string;
    let label = e.label;
    switch (e.kind) {
      case "debut":
        stage = "Debut";
        label = label.replace(/^approx\. first visible$/i, "First visible post (approximate debut)");
        break;
      case "peak":
        stage = "Breakout";
        sawViral = true;
        break;
      case "viral":
        stage = sawViral ? "Viral post" : "First viral post";
        sawViral = true;
        break;
      case "collab":
        stage = "Collab";
        break;
      case "token":
        stage = "Token launch";
        break;
      case "milestone":
        stage = "Milestone";
        break;
      default:
        stage = label === "Latest post captured" ? "Latest post" : "Moment";
    }
    steps.push({ ...e, label, stage });
  }
  if (c.ranks) {
    const best =
      c.ranks.momentum <= c.ranks.fame
        ? `#${c.ranks.momentum} Momentum`
        : `#${c.ranks.fame} Fame`;
    steps.push({
      date: AS_OF,
      label: `${best} · ${c.phase ?? c.heat.toLowerCase()}`,
      value: null,
      kind: "now",
      stage: "Current phase",
      status: "INFERRED",
      note: "Rank from this index; phase is an analyst reading of the trajectory.",
    });
  }
  return steps;
}
