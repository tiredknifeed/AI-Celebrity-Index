import Link from "next/link";
import Portrait from "./Portrait";
import { portraitOf } from "@/data/portraits";
import { bySlug } from "@/lib/data";
import type { Universe } from "@/lib/types";

/** Character ecosystems as clusters of faces. */
export default function UniverseGrid({ universes }: { universes: Universe[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {universes.map((u) => {
        const members = u.members.map((s) => bySlug(s)!).filter(Boolean);
        const hub = bySlug(u.hub) ?? members[0];
        return (
          <Link
            key={u.id}
            href={`/network/?u=${u.id}`}
            className="group panel relative flex min-h-[260px] flex-col justify-between overflow-hidden p-5 transition-all hover:-translate-y-1 hover:shadow-lift"
          >
            <div className="relative z-10">
              <p className="kicker">{members.length} character{members.length === 1 ? "" : "s"}</p>
              <h3 className="display mt-2 text-4xl leading-[0.9]">{u.name}</h3>
              <p className="mt-2 max-w-[85%] text-sm leading-snug text-ink/65">{u.tagline}</p>
            </div>
            <div className="relative mt-6 flex items-end">
              {members.slice(0, 6).map((m, i) => (
                <span
                  key={m.slug}
                  className={`relative -ml-3 overflow-hidden rounded-full ring-4 ring-card transition-transform duration-300 first:ml-0 group-hover:-translate-y-1 ${
                    m.slug === hub?.slug ? "h-24 w-24" : "h-16 w-16"
                  }`}
                  style={{ background: portraitOf(m.slug).accent, transitionDelay: `${i * 40}ms`, zIndex: 10 - i }}
                  title={m.name}
                >
                  <Portrait c={m} className="absolute inset-0 h-full w-full" />
                </span>
              ))}
              {members.length > 6 && (
                <span className="-ml-3 grid h-16 w-16 place-items-center rounded-full bg-ink font-mono text-sm text-white ring-4 ring-card">
                  +{members.length - 6}
                </span>
              )}
              <span className="ml-auto font-mono text-xs uppercase tracking-[0.14em] opacity-0 transition-opacity group-hover:opacity-100">
                Isolate →
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
