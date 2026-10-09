// Shape of src/data/generated/index.json (written by scripts/build_data.py).
// A future backend should return the same shape so the UI does not change.

export type Trust = "OBSERVED" | "INFERRED" | "UNKNOWN";
export type Identity = "VERIFIED" | "OFFICIAL" | "UNVERIFIED" | "PARODY" | "COMMUNITY" | "UNKNOWN";
export type Heat = "ON FIRE" | "HOT" | "RISING" | "STEADY" | "COOLING" | "DORMANT";
export type StatusCode =
  | "ACTIVE_TODAY"
  | "POSTING"
  | "BREAKING_OUT"
  | "STABLE"
  | "COOLING"
  | "DORMANT"
  | "UNKNOWN";
export type Kind = "human" | "animal" | "virtual" | "toon";
export type Inclusion = "INCLUDED" | "WATCHLIST";
export type EdgeType = "COLLAB" | "MENTION" | "RIVAL" | "STORYLINE" | "SAME_UNIVERSE";
export type TimelineKind = "debut" | "viral" | "peak" | "token" | "collab" | "milestone" | "moment";

export interface Post {
  url: string;
  date: string | null;
  likes: number | null;
  comments?: number | null;
  caption?: string | null;
}

export interface TimelineEvent {
  date: string | null;
  label: string;
  value: number | null;
  kind: TimelineKind;
  status: Trust;
  url?: string | null;
  note?: string | null;
}

export interface TrajectoryPoint {
  start: string | null;
  end: string | null;
  posts: number | null;
  avgLikes: number;
  label: string;
}

export type TokenVerification = "CONTRACT" | "PROFILE" | "UNVERIFIED" | "NONE";

export interface Token {
  status: "IG_OBSERVED" | "NONE";
  /** CONTRACT: full address on the profile or editor-confirmed; PROFILE: ticker/link on the profile only. */
  verification: TokenVerification;
  /** Full contract address: shown on the character's own profile, or confirmed by the editors. */
  contract: string | null;
  /** Where the contract comes from: the character's bio, or data/tokens.json (editor-confirmed). */
  contractSource: "PROFILE" | "EDITOR" | null;
  editorConfirmed?: string | null;
  reference?: string | null;
  ticker: string | null;
  chain: "SOLANA" | null;
  contractInBio: boolean;
  note: string | null;
  url: string | null;
  reported: string | null;
  userSupplied: string | null;
}

export interface Scores {
  fame: number;
  momentum: number;
  distinctiveness: number;
  sufficiency: number;
  index: number;
  fameParts: Record<
    "followers" | "engagement" | "viral" | "consistency" | "longevity" | "recognizability",
    number | null
  >;
  momentumParts: Record<"engagement" | "viral" | "frequency" | "growth" | "recency", number | null>;
  distinctParts: Record<"visual" | "personality" | "lore" | "crossCharacter", number | null>;
  recognizabilityInput: number | null;
}

export interface LinkRef {
  handle: string;
  count: number;
  note: string;
}

export interface ExternalLink {
  handle: string;
  kind: string;
  linkType: string;
  count: number;
  evidence: string[];
}

export interface Character {
  id: number;
  slug: string;
  name: string;
  fullName: string;
  handle: string;
  profileUrl: string;
  group: "SEED" | "DISCOVERED" | "REVIEWED";
  inclusion: Inclusion;
  caveat: string | null;
  characterType: string;
  origin: string | null;
  kind: Kind;
  virtual: boolean;
  universe: string;
  universeNote: string | null;
  identity: Identity;
  identityFlag: string | null;
  verifiedBadge: boolean;
  parodyOf: string | null;
  disambiguation: string | null;
  copycats: string | null;
  followers: number;
  following: number | null;
  posts: number | null;
  postsAnalysed: number | null;
  fullHistory: string | null;
  firstPost: string | null;
  firstPostBasis: string | null;
  lastPost: string | null;
  daysSinceLastPost: number | null;
  posts7d: number | null;
  posts14d: number | null;
  posts30d: number | null;
  postsPerWeek: number | null;
  avgLikes: number | null;
  medianLikes: number | null;
  avgComments: number | null;
  likesHidden: number | null;
  engagementRate: number | null;
  engagementLevel: string | null;
  avgLikes14d: number | null;
  avgComments14d: number | null;
  maxLikes: number | null;
  topPost: Post | null;
  topPost14d: Post | null;
  topPostNote: string | null;
  bio: string | null;
  linkInBio: string | null;
  token: Token;
  related: string | null;
  personality: string | null;
  visualStyle: string | null;
  contentFormat: string | null;
  notes: string | null;
  why: string | null;
  scores: Scores;
  heat: Heat;
  status: { code: StatusCode; basis: string };
  phase: string | null;
  debut: { date: string | null; basis: string | null; url: string | null };
  peak: { date: string | null; likes: number | null; url: string | null } | null;
  trajectory: TrajectoryPoint[];
  timeline: TimelineEvent[];
  evidence: { url: string; label: string }[];
  realPeopleTagged: string[];
  brandsTagged: string[];
  suggestedNeighbours: string | null;
  outLinks: LinkRef[];
  inLinks: LinkRef[];
  externalLinks: ExternalLink[];
  sufficiency: { flags: Record<string, string | null>; basis: string | null };
  ranks: { index: number; fame: number; momentum: number; distinctiveness: number } | null;
  degree: number;
  sources: number[];
  seed?: {
    recentActivity: string | null;
    debutNote: string | null;
    recurringThemes: string | null;
    mostSuccessfulPosts: string | null;
    notableReels: string | null;
    viralMoments: string | null;
    brandCollabs: string | null;
    interactions: string | null;
    active: string | null;
  };
}

/** An included character: always ranked. */
export type Ranked = Character & { ranks: NonNullable<Character["ranks"]> };

export interface Edge {
  source: string;
  target: string;
  type: EdgeType;
  count: number;
  note: string | null;
  raw: string | null;
  evidence: string[];
  observedOn?: string | null;
  status: Trust;
}

export interface Universe {
  id: string;
  name: string;
  tagline: string;
  members: string[];
  hub: string;
}

export interface Source {
  n: number;
  type: string | null;
  title: string;
  url: string | null;
  accessed: string | null;
  usedFor: string | null;
  handle: string | null;
}

export interface Excluded {
  name: string;
  handle: string;
  profileUrl: string;
  reason: string | null;
  followers: number | null;
}

export interface Dataset {
  meta: {
    title: string;
    asOf: string;
    generatedFrom: string;
    counts: { included: number; watchlist: number; excluded: number };
    legend: string;
  };
  characters: Character[];
  edges: Edge[];
  universes: Universe[];
  excluded: Excluded[];
  sources: Source[];
  methodology: {
    params: { key: string; description: string; value: string | number }[];
    definitions: string[];
  };
}
