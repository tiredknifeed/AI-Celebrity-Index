import Link from "next/link";
import Portrait from "./Portrait";
import { HEAT_STYLE, HeatChip, IdentityBadge, StatusChip } from "./Chips";
import { FameDisc, HeatBar } from "./Scores";
import { TokenChip } from "./Token";
import { avatarBg, portraitOf } from "@/data/portraits";
import { compact, shortDate } from "@/lib/format";
import { tokenCard } from "@/lib/data";
import type { Character } from "@/lib/types";

/** Large horizontal card for the strongest current Momentum. */
export default function BreakoutCard({ c, place }: { c: Character; place: number }) {
  const heat = HEAT_STYLE[c.heat];
  const peak14 = c.topPost14d?.likes ?? null;
  const light = c.heat === "RISING" || c.heat === "STEADY" || c.heat === "COOLING" || c.heat === "DORMANT";
  return (
    <Link
      href={`/c/${c.slug}/`}
      className="group relative grid h-full overflow-hidden rounded-5xl bg-card shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
    >
      <div className="relative min-h-[300px] overflow-hidden sm:min-h-[420px]" style={avatarBg(c.slug)}>
        <div className="grain absolute inset-0 opacity-60" />
        <Portrait c={c} variant="cutout" className="absolute inset-x-0 bottom-0 h-[94%] w-full transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute left-4 top-4 rounded-2xl bg-ink px-3 py-1 font-display text-2xl font-extrabold text-white shadow-sticker">
          ↑{place}
        </span>
        <div className="absolute bottom-4 left-4">
          <StatusChip code={c.status.code} solid />
        </div>
        <div className="absolute right-4 top-4">
          <FameDisc value={c.scores.fame} size={70} accent={portraitOf(c.slug).accent} />
        </div>
      </div>
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="chip bg-ink text-white">#{c.ranks?.index} in the index</span>
          {c.identity === "PARODY" && <IdentityBadge identity="PARODY" />}
        </div>
        <div>
          <h3 className="display text-4xl leading-[0.88] sm:text-[46px]">{c.name}</h3>
          <p className="mt-1 font-mono text-xs text-muted">@{c.handle}</p>
        </div>
        <div className="flex items-end gap-3">
          <div className="rounded-3xl px-4 py-3" style={{ background: heat.color, color: light ? "#141414" : "#fff" }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-80">Momentum</div>
            <div className="font-display text-5xl font-extrabold leading-none tabular-nums">{c.scores.momentum.toFixed(0)}</div>
          </div>
          <div className="mb-1 flex flex-col gap-1.5">
            <HeatChip heat={c.heat} />
            {peak14 && <span className="font-display text-xl font-extrabold uppercase leading-none">{compact(peak14)}-like peak</span>}
          </div>
        </div>
        <HeatBar value={c.scores.momentum} heat={c.heat} showLabel={false} />
        <dl className="grid grid-cols-3 gap-3 border-t border-line pt-4">
          <div>
            <dt className="kicker">Posts · 14d</dt>
            <dd className="font-display text-2xl font-extrabold">{c.posts14d ?? "—"}</dd>
          </div>
          <div>
            <dt className="kicker">Last post</dt>
            <dd className="font-display text-2xl font-extrabold">{shortDate(c.lastPost)}</dd>
          </div>
          <div>
            <dt className="kicker">Followers</dt>
            <dd className="font-display text-2xl font-extrabold">{compact(c.followers)}</dd>
          </div>
        </dl>
        <div className="mt-auto">
          <TokenChip t={tokenCard(c)} />
        </div>
      </div>
    </Link>
  );
}
