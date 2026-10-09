// Presentation layer for each character: accent colour and portrait source.
//
// Photo portraits are stills from the supplied promo video (public/portraits).
// Everyone else gets a flat "sticker" illustration built from the visual
// description in the research workbook. When the workbook marks the look as
// UNKNOWN we draw a neutral placeholder instead of inventing a face.
// To use real imagery later, add public/portraits/<slug>.webp (+ cutouts/) and
// set `photo: true` here.

export type HairStyle =
  | "bowl"
  | "bob"
  | "pageboy"
  | "emo"
  | "buns"
  | "updo"
  | "long"
  | "pinkbob"
  | "short"
  | "slick";

export interface HumanArt {
  kind: "human";
  skin: string;
  hair: { style: HairStyle; color: string };
  facial?: { style: "curl" | "thin" | "thick"; color: string };
  glasses?: { style: "round" | "shades" | "cateye"; color: string };
  outfit: { style: "suit" | "thobe" | "tank" | "tee" | "blouse" | "hoodie"; color: string; accent?: string };
  body?: "normal" | "muscle";
  eyes?: "normal" | "hidden" | "sly";
  mouth?: "smile" | "smirk" | "flat" | "open";
  brows?: "calm" | "angry" | "raised";
  extras?: ("freckles" | "pearls" | "chain" | "earrings" | "lipstick" | "blush")[];
}

export interface CreatureArt {
  kind: "greyhound" | "monkey" | "gorilla" | "catknight" | "dog" | "sausage" | "stretchy" | "bigfoot" | "duo";
  primary: string;
  secondary?: string;
  accent?: string;
  variant?: "female";
}

export interface UnknownArt {
  kind: "unknown";
}

export type Art = HumanArt | CreatureArt | UnknownArt;

export interface PortraitSpec {
  accent: string;
  /** Text colour that reads on the accent. */
  onAccent?: string;
  photo?: boolean;
  /** CSS object-position for the photo crop, so faces stay in frame. */
  photoPos?: string;
  art?: Art;
  /** How the look was established: OBSERVED in posts, or INFERRED from captions. */
  basis?: "OBSERVED" | "INFERRED";
}

const UNKNOWN: Art = { kind: "unknown" };

export const portraits: Record<string, PortraitSpec> = {
  "derek-mercer": {
    accent: "#C6F432",
    basis: "OBSERVED",
    art: {
      kind: "human",
      skin: "#EBC3A1",
      hair: { style: "emo", color: "#141414" },
      outfit: { style: "tank", color: "#151515", accent: "#C6F432" },
      body: "muscle",
      eyes: "hidden",
      mouth: "flat",
    },
  },
  "abu-nutty": {
    accent: "#FF5A36",
    onAccent: "#fff",
    basis: "INFERRED",
    art: { kind: "monkey", primary: "#7A4A2A", secondary: "#E8C49A", accent: "#E63A2E" },
  },
  "granny-spills": {
    accent: "#F7A1C4",
    basis: "INFERRED",
    art: {
      kind: "human",
      skin: "#F2D0B9",
      hair: { style: "updo", color: "#F6F2EC" },
      glasses: { style: "cateye", color: "#141414" },
      outfit: { style: "blouse", color: "#161616" },
      mouth: "smirk",
      brows: "raised",
      extras: ["pearls", "earrings", "lipstick"],
    },
  },
  "jean-phil": { accent: "#4F7FC4", onAccent: "#fff", photo: true },
  "abu-shalab": { accent: "#EDB54F", photo: true, photoPos: "50% 25%" },
  "casper-the-italian-greyhound": {
    accent: "#9BCBB1",
    basis: "INFERRED",
    art: { kind: "greyhound", primary: "#BDB8B2", secondary: "#F7F4EF", accent: "#FF6B35" },
  },
  "archibald-brown": {
    accent: "#CFA06A",
    basis: "OBSERVED",
    art: {
      kind: "human",
      skin: "#EEC9AA",
      hair: { style: "bowl", color: "#7A4724" },
      facial: { style: "thin", color: "#5A3418" },
      outfit: { style: "suit", color: "#DCC7A3", accent: "#3A2A1E" },
      mouth: "smirk",
      brows: "angry",
    },
  },
  "mr-stretchy": {
    accent: "#FFB547",
    basis: "INFERRED",
    art: { kind: "stretchy", primary: "#F6D7B8", secondary: "#3BA55C" },
  },
  "candy-the-greyhound": {
    accent: "#F4AE79",
    basis: "INFERRED",
    art: { kind: "greyhound", primary: "#C98B57", secondary: "#F3E3CF", accent: "#E5383B" },
  },
  "nobody-sausage": {
    accent: "#FF8A65",
    basis: "INFERRED",
    art: { kind: "sausage", primary: "#E4593B", secondary: "#FFB199" },
  },
  "sickman": {
    accent: "#A9B6C6",
    basis: "INFERRED",
    art: { kind: "catknight", primary: "#C7CED6", secondary: "#F08A24", accent: "#D7263D" },
  },
  "benjamin-stachio": { accent: "#ECC660", photo: true },
  "lord-farquaad": { accent: "#A3364A", onAccent: "#fff", photo: true, photoPos: "38% 0%" },
  "caramelinho": {
    accent: "#43C06F",
    basis: "INFERRED",
    art: { kind: "dog", primary: "#C8873E", secondary: "#F6E6CF", accent: "#F7D02C" },
  },
  "abdoul-cheqri": { accent: "#E09A55", art: UNKNOWN },
  "pik-vik": {
    accent: "#7CC3E0",
    basis: "INFERRED",
    art: { kind: "duo", primary: "#1E1E1E", secondary: "#F29E4C" },
  },
  "ms-stretchy": {
    accent: "#FF9BB8",
    basis: "INFERRED",
    art: { kind: "stretchy", primary: "#F6D7B8", secondary: "#FF5D8F", variant: "female" },
  },
  "cuca-beludo": { accent: "#63B86A", art: UNKNOWN },
  "don-gorillo-mkrtchyan": {
    accent: "#F06A3E",
    onAccent: "#fff",
    basis: "INFERRED",
    art: { kind: "gorilla", primary: "#2A2826", secondary: "#7A6F66" },
  },
  "milton-bumford": {
    accent: "#E2B33C",
    basis: "INFERRED",
    art: {
      kind: "human",
      skin: "#DDA882",
      hair: { style: "slick", color: "#1B1B1B" },
      glasses: { style: "shades", color: "#141414" },
      outfit: { style: "suit", color: "#8C2F2A", accent: "#E2B33C" },
      mouth: "smile",
      extras: ["chain"],
    },
  },
  "lil-miquela": {
    accent: "#F6A65C",
    basis: "INFERRED",
    art: {
      kind: "human",
      skin: "#F0CBA9",
      hair: { style: "buns", color: "#3B2418" },
      outfit: { style: "tee", color: "#F7F4EE" },
      mouth: "flat",
      extras: ["freckles"],
    },
  },
  "vulu-zamal": { accent: "#E58466", art: UNKNOWN },
  "percival-ashcroft": { accent: "#8FA37A", art: UNKNOWN },
  "abu-yalla": {
    accent: "#E8AE5E",
    basis: "INFERRED",
    art: {
      kind: "human",
      skin: "#CF9B78",
      hair: { style: "short", color: "#1C1612" },
      facial: { style: "thick", color: "#1C1612" },
      outfit: { style: "thobe", color: "#F7F4EE" },
      mouth: "smile",
    },
  },
  "don-nuger": { accent: "#F2A653", art: UNKNOWN },
  "edmond-lebon": { accent: "#C27A3A", onAccent: "#fff", art: UNKNOWN },
  "auntie-aurora": { accent: "#F59A4A", art: UNKNOWN },
  "bigfoot-vlog": {
    accent: "#8DB27A",
    basis: "INFERRED",
    art: { kind: "bigfoot", primary: "#6B4A33", secondary: "#9C7A5E" },
  },
  "aitana-lopez": {
    accent: "#FF9DB0",
    basis: "INFERRED",
    art: {
      kind: "human",
      skin: "#F2CDB3",
      hair: { style: "long", color: "#F27BA0" },
      outfit: { style: "tank", color: "#F7F4EE", accent: "#FF6F91" },
      mouth: "smile",
      extras: ["earrings"],
    },
  },
  "imma": {
    accent: "#FFB3CF",
    basis: "INFERRED",
    art: {
      kind: "human",
      skin: "#F4D6C1",
      hair: { style: "pinkbob", color: "#F48FB1" },
      outfit: { style: "tee", color: "#161616" },
      mouth: "flat",
    },
  },
  "imran-poppadumb": { accent: "#EDCB6B", art: UNKNOWN },
  "mia-zelu": {
    accent: "#F5CB5C",
    basis: "INFERRED",
    art: {
      kind: "human",
      skin: "#F2CFB6",
      hair: { style: "long", color: "#E9C46A" },
      outfit: { style: "blouse", color: "#FFFFFF" },
      mouth: "smile",
      extras: ["earrings"],
    },
  },
  "tony-ravioliano": { accent: "#E0566A", onAccent: "#fff", art: UNKNOWN },
  "kyra": {
    accent: "#F6926D",
    basis: "INFERRED",
    art: {
      kind: "human",
      skin: "#B97A57",
      hair: { style: "long", color: "#1E140F" },
      outfit: { style: "blouse", color: "#E9B44C" },
      mouth: "smile",
      extras: ["earrings"],
    },
  },
  "shudu": {
    accent: "#D4AF37",
    basis: "INFERRED",
    art: {
      kind: "human",
      skin: "#5C3B2B",
      hair: { style: "short", color: "#111111" },
      outfit: { style: "blouse", color: "#E07A5F" },
      mouth: "flat",
      extras: ["earrings"],
    },
  },
  "tilly-norwood": {
    accent: "#B2C29A",
    basis: "INFERRED",
    art: {
      kind: "human",
      skin: "#F1CDB5",
      hair: { style: "long", color: "#6B4226" },
      outfit: { style: "blouse", color: "#2B2B2B" },
      mouth: "smile",
    },
  },
  "bill-smith-prince": { accent: "#6DB3AA", photo: true, photoPos: "50% 35%" },
  "brigitte-macaron": { accent: "#E63946", onAccent: "#fff", photo: true },
};

const FALLBACK: PortraitSpec = { accent: "#CFC8BA", art: UNKNOWN };

export function portraitOf(slug: string): PortraitSpec {
  return portraits[slug] ?? FALLBACK;
}
