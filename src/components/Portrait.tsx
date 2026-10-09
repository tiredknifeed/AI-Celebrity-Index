import CharacterArt from "./CharacterArt";
import { portraitOf } from "@/data/portraits";
import type { Character } from "@/lib/types";

type Variant = "card" | "cutout";

/**
 * The character's face. Photo stills where we have them, otherwise the
 * sticker illustration (or a neutral placeholder when the look is unknown).
 */
export default function Portrait({
  c,
  variant = "card",
  className = "",
  priority = false,
}: {
  c: Pick<Character, "slug" | "name">;
  variant?: Variant;
  className?: string;
  priority?: boolean;
}) {
  const spec = portraitOf(c.slug);
  if (spec.photo) {
    const src = variant === "cutout" ? `/portraits/cutouts/${c.slug}.webp` : `/portraits/${c.slug}.webp`;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${c.name}, still from the promo video`}
        loading={priority ? "eager" : "lazy"}
        draggable={false}
        style={variant === "card" && spec.photoPos ? { objectPosition: spec.photoPos } : undefined}
        className={`${variant === "cutout" ? "object-contain object-bottom" : "object-cover object-top"} ${className}`}
      />
    );
  }
  return <CharacterArt art={spec.art} name={c.name} className={className} />;
}

/** Small label explaining what the portrait is. */
export function portraitCredit(slug: string): string {
  const spec = portraitOf(slug);
  if (spec.photo) return "Still from promo video";
  if (!spec.art || spec.art.kind === "unknown") return "Portrait not captured";
  return spec.basis === "OBSERVED" ? "Illustration · from observed posts" : "Illustration · inferred look";
}
