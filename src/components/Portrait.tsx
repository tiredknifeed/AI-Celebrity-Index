import CharacterArt from "./CharacterArt";
import { portraitOf } from "@/data/portraits";
import type { Character } from "@/lib/types";

/**
 * cutout  – transparent subject for layered layouts (hero, podium, profile
 *           header, collectible cards); sits on the CSS `avatarBg()`.
 * card    – same as cutout (kept for call-site readability).
 * compact – the baked square avatar for small placements (lists, search,
 *           graph nodes). `size` picks the 160 or 512 export.
 */
type Variant = "card" | "cutout" | "compact";

export default function Portrait({
  c,
  variant = "card",
  className = "",
  priority = false,
  size = 160,
}: {
  c: Pick<Character, "slug" | "name">;
  variant?: Variant;
  className?: string;
  priority?: boolean;
  size?: 160 | 512 | 1024;
}) {
  const spec = portraitOf(c.slug);
  if (spec.avatar) {
    const compact = variant === "compact";
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={compact ? `/avatars/${c.slug}/avatar-${size}.webp` : `/avatars/${c.slug}/cutout-1024.webp`}
        alt={`${c.name} avatar`}
        loading={priority ? "eager" : "lazy"}
        draggable={false}
        className={`${compact ? "object-cover" : "object-contain object-bottom"} ${className}`}
      />
    );
  }
  return (
    <CharacterArt
      art={spec.art}
      name={c.name}
      className={`${variant === "compact" ? "" : "drop-shadow-[0_14px_14px_rgba(0,0,0,0.2)]"} ${className}`}
    />
  );
}

/** Small label explaining what the portrait is. */
export function portraitCredit(slug: string): string {
  const spec = portraitOf(slug);
  if (spec.avatar)
    return { "x-avatar": "Official X avatar · normalized", editor: "Editor-supplied portrait · normalized", "promo-still": "Promo still · normalized" }[spec.source ?? "promo-still"];
  if (!spec.art || spec.art.kind === "unknown") return "Portrait not captured";
  return spec.basis === "OBSERVED" ? "Illustration · from observed posts" : "Illustration · inferred look";
}
