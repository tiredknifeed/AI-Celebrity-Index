import Link from "next/link";
import Portrait from "./Portrait";
import { avatarBg, portraitOf } from "@/data/portraits";
import type { Character } from "@/lib/types";

/** Endless parade of faces. */
export default function Marquee({ people }: { people: Character[] }) {
  const loop = [...people, ...people];
  return (
    <div className="relative overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
        {loop.map((c, i) => (
          <Link
            key={`${c.slug}-${i}`}
            href={`/c/${c.slug}/`}
            className="group relative h-40 w-32 shrink-0 overflow-hidden rounded-3xl shadow-card sm:h-52 sm:w-40"
            style={avatarBg(c.slug)}
            aria-hidden={i >= people.length}
            tabIndex={i >= people.length ? -1 : undefined}
          >
            <Portrait c={c} variant="compact" size={512} className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-110" />
            <span className="absolute inset-x-2 bottom-2 truncate rounded-full bg-paper/90 px-2 py-1 text-center font-display text-[11px] font-extrabold uppercase">
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
