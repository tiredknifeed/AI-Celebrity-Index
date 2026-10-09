import type { Character, EdgeType } from "./types";

// Plain label tables. Kept apart from data.ts so client components can use
// them without bundling the whole dataset.

export const HEAT_ORDER = ["ON FIRE", "HOT", "RISING", "STEADY", "COOLING", "DORMANT"] as const;

export const STATUS_LABEL: Record<Character["status"]["code"], string> = {
  ACTIVE_TODAY: "Active today",
  POSTING: "Posting",
  BREAKING_OUT: "Breaking out",
  STABLE: "Stable",
  COOLING: "Cooling",
  DORMANT: "Dormant",
  UNKNOWN: "Unknown",
};

export const EDGE_LABEL: Record<EdgeType, string> = {
  COLLAB: "Collab",
  MENTION: "Mention",
  RIVAL: "Rival",
  STORYLINE: "Storyline",
  SAME_UNIVERSE: "Same universe",
};

export const EDGE_COLOR: Record<EdgeType, string> = {
  RIVAL: "#FF4D1F",
  STORYLINE: "#E0559A",
  COLLAB: "#18A957",
  MENTION: "#141414",
  SAME_UNIVERSE: "#A8A296",
};
