import Link from "next/link";
import Portrait from "./Portrait";
import { HEAT_STYLE, HeatChip, IdentityBadge, StatusChip } from "./Chips";
import { portraitOf } from "@/data/portraits";
import { compact, shortDate } from "@/lib/format";
import type { Character } from "@/lib/types";

/** Large horizontal card for the strongest current Momentum. */
export default function BreakoutCard({ c, place }: { c: Character; place: number }) {
  const spec = portraitOf(c.slug);
  const heat = HEAT_STYLE[c.heat];
  const peak14 = c.topPost14d?.likes ?? null;
  return (
    <Link
      href={`/c/${c.slug}/`}
      className="group relative grid h-full overflow-hidden rounded-5xl bg-card shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
    >
      <div className="relative min-h-[260px] overflow-hidden sm:min-h-[340px]" style={{ background: spec.accent }}>
        <div className="grain absolute inset-0 opacity-60" />
        <Portrait
          c={c}
          variant="cutout"
          className="absolute inset-x-0 bottom-0 h-[94%] w-full transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-ink px-3 py-1 font-display text-lg font-extrabold text-white shadow-sticker">
          ↑ #{place}
        </span>
      </div>
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap gap-1.5">
          <StatusChip code={c.status.code} />
          {c.identity === "PARODY" && <IdentityBadge identity="PARODY" />}
        </div>
        <div>
          <h3 className="display text-4xl leading-[0.88] sm:text-[44px]">{c.name}</h3>
          <p className="mt-1 font-mono text-xs text-muted">@{c.handle}</p>
        </div>
        <div className="flex items-end gap-3">
          <div className="rounded-3xl px-4 py-3" style={{ background: heat.color, color: c.heat === "RISING" ? "#141414" : "#fff" }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-80">Momentum</div>
            <div className="font-display text-5xl font-extrabold leading-none tabular-nums">+{c.scores.momentum.toFixed(0)}</div>
          </div>
          <HeatChip heat={c.heat} className="mb-1" />
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4">
          <div>
            <dt className="kicker">Peak · 14 days</dt>
            <dd className="font-display text-2xl font-extrabold">{peak14 ? `${compact(peak14)}-like` : "—"}</dd>
          </div>
          <div>
            <dt className="kicker">Posts · 14 days</dt>
            <dd className="font-display text-2xl font-extrabold">{c.posts14d ?? "—"}</dd>
          </div>
          <div>
            <dt className="kicker">Followers</dt>
            <dd className="font-display text-2xl font-extrabold">{compact(c.followers)}</dd>
          </div>
          <div>
            <dt className="kicker">Last post</dt>
            <dd className="font-display text-2xl font-extrabold">{shortDate(c.lastPost)}</dd>
          </div>
        </dl>
        {c.why && <p className="line-clamp-3 text-sm leading-relaxed text-ink/70">{c.why}</p>}
      </div>
    </Link>
  );
}
