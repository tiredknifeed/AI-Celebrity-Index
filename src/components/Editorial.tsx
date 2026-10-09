import Link from "next/link";
import Portrait from "./Portrait";
import { StatusChip, TrustTag } from "./Chips";
import { FameDisc } from "./Scores";
import { avatarBg, portraitOf } from "@/data/portraits";
import { compact, shortDate, stripTrust } from "@/lib/format";
import type { Character, Trust, Universe } from "@/lib/types";
import { EDGE_LABEL } from "@/lib/labels";
import type { Relationship } from "@/lib/data";

export interface Fact {
  label: string;
  value: string;
  trust: Trust;
}

/** "Why everyone is talking about…" — a cover story built only from dataset facts. */
export function CoverStory({ c, facts, rels }: { c: Character; facts: Fact[]; rels: Relationship[] }) {
  return (
    <article className="grid overflow-hidden rounded-5xl bg-card shadow-card lg:grid-cols-2">
      <Link href={`/c/${c.slug}/`} className="group relative min-h-[420px] overflow-hidden lg:min-h-[640px]" style={avatarBg(c.slug)}>
        <div className="grain absolute inset-0 opacity-60" />
        <Portrait c={c} variant="cutout" className="absolute inset-x-0 bottom-0 h-[96%] w-full transition-transform duration-700 group-hover:scale-[1.03]" />
        <div className="absolute left-5 top-5 flex flex-col gap-2">
          <span className="w-fit rounded-full bg-ink px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-white">Cover story</span>
          <StatusChip code={c.status.code} solid />
        </div>
        <div className="absolute bottom-5 right-5">
          <FameDisc value={c.scores.fame} size={108} accent={portraitOf(c.slug).accent} />
        </div>
      </Link>
      <div className="flex flex-col p-6 sm:p-10">
        <p className="kicker">The story · {shortDate(c.debut.date)} → now</p>
        <h3 className="display mt-3 text-5xl leading-[0.88] sm:text-7xl">
          Why everyone is talking about {c.name}
        </h3>
        {c.why && <p className="mt-6 text-xl font-semibold leading-snug">{stripTrust(c.why)}</p>}
        <dl className="mt-8 grid grid-cols-2 gap-3">
          {facts.map((f) => (
            <div key={f.label} className="rounded-3xl bg-paper p-4">
              <dt className="kicker flex items-center gap-2">
                {f.label} <TrustTag trust={f.trust} />
              </dt>
              <dd className="mt-1 font-display text-2xl font-extrabold leading-tight sm:text-3xl">{f.value}</dd>
            </div>
          ))}
        </dl>
        {rels.length > 0 && (
          <div className="mt-6">
            <p className="kicker mb-2">In the story</p>
            <div className="flex flex-wrap gap-2">
              {rels.map((r) => (
                <Link
                  key={r.other.slug}
                  href={r.other.ranks ? `/c/${r.other.slug}/` : r.other.profileUrl}
                  className="flex items-center gap-2 rounded-full bg-paper py-1 pl-1 pr-3 transition-colors hover:bg-ink hover:text-white"
                >
                  <span className="relative h-8 w-8 overflow-hidden rounded-full" style={avatarBg(r.other.slug)}>
                    <Portrait c={r.other} variant="compact" className="absolute inset-0 h-full w-full" />
                  </span>
                  <span className="font-display text-sm font-extrabold uppercase">{r.other.name}</span>
                  <span className="font-mono text-[10px] uppercase opacity-60">{EDGE_LABEL[r.type]}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        <Link href={`/c/${c.slug}/`} className="mt-auto w-fit rounded-full bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.14em] text-white sm:mt-10">
          Read the full profile →
        </Link>
      </div>
    </article>
  );
}

/** A universe told as a story: who is in it and what the data says. */
export function UniverseStory({
  u,
  members,
  facts,
  headline,
}: {
  u: Universe;
  members: Character[];
  facts: Fact[];
  headline: string;
}) {
  return (
    <article className="overflow-hidden rounded-5xl bg-ink text-white shadow-lift">
      <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">Universe report · ✺ {u.name}</p>
          <h3 className="display mt-3 text-5xl leading-[0.88] sm:text-7xl">{headline}</h3>
          <p className="mt-5 max-w-md text-white/70">{u.tagline}</p>
          <dl className="mt-8 grid grid-cols-2 gap-3">
            {facts.map((f) => (
              <div key={f.label} className="rounded-3xl bg-white/[0.07] p-4">
                <dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">
                  {f.label}
                </dt>
                <dd className="mt-1 font-display text-2xl font-extrabold leading-tight">{f.value}</dd>
              </div>
            ))}
          </dl>
          <Link href={`/network/?u=${u.id}`} className="mt-8 inline-block rounded-full bg-white px-6 py-3 font-mono text-xs uppercase tracking-[0.14em] text-ink">
            Open this universe →
          </Link>
        </div>
        <div className="relative flex min-h-[360px] items-end justify-center">
          {members.slice(0, 5).map((m, i) => {
            const n = Math.min(members.length, 5);
            const mid = (n - 1) / 2;
            const off = i - mid;
            const big = i === 0;
            return (
              <Link
                key={m.slug}
                href={`/c/${m.slug}/`}
                className="group absolute bottom-0 aspect-square transition-transform hover:-translate-y-2"
                style={{
                  width: big ? "52%" : "34%",
                  left: `${50 + off * 19 - (big ? 26 : 17)}%`,
                  zIndex: 10 - Math.abs(Math.round(off)),
                  bottom: big ? 0 : `${Math.abs(off) * 6}%`,
                }}
              >
                <span className="absolute inset-[10%] rounded-full opacity-90" style={avatarBg(m.slug)} />
                <Portrait c={m} variant="cutout" className="absolute inset-0 h-full w-full" />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-paper px-2.5 py-0.5 font-display text-[11px] font-extrabold uppercase text-ink">
                  {m.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </article>
  );
}

export interface ViralStep {
  date: string | null;
  label: string;
  value: number | null;
  url?: string | null;
}

/** From 0 to viral: the fastest jump in the dataset, as a story strip. */
export function CareerMoment({ c, steps, days }: { c: Character; steps: ViralStep[]; days: number }) {
  return (
    <article className="overflow-hidden rounded-5xl bg-card shadow-card">
      <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
        <Link href={`/c/${c.slug}/#career`} className="group relative min-h-[360px] overflow-hidden" style={avatarBg(c.slug)}>
          <div className="grain absolute inset-0 opacity-60" />
          <Portrait c={c} variant="cutout" className="absolute inset-x-0 bottom-0 h-[94%] w-full transition-transform duration-700 group-hover:scale-[1.03]" />
          <span className="absolute left-5 top-5 rounded-full bg-ink px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-white">
            Career moment of the week
          </span>
        </Link>
        <div className="p-6 sm:p-10">
          <p className="kicker">From 0 to viral</p>
          <h3 className="display mt-3 text-5xl leading-[0.88] sm:text-7xl">
            {c.name}: {days === 0 ? "viral on day one" : `${days} days to ${compact(c.peak?.likes ?? c.maxLikes)}`}
          </h3>
          <ol className="relative mt-8 border-l-4 border-ink/10 pl-6">
            {steps.map((s, i) => (
              <li key={i} className="relative mb-6 last:mb-0">
                <span className={`absolute -left-[34px] top-1 h-4 w-4 rounded-full ring-4 ring-card ${i === steps.length - 1 ? "bg-fire" : "bg-ink"}`} />
                <div className="font-mono text-xs uppercase tracking-[0.14em] text-muted">{shortDate(s.date)}</div>
                <div className="font-display text-2xl font-extrabold uppercase leading-tight">
                  {s.value ? `${compact(s.value)} likes` : s.label}
                </div>
                {s.value && <div className="text-sm text-ink/70">{s.label}</div>}
                {s.url && (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] uppercase tracking-[0.1em] underline">
                    Source post ↗
                  </a>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  );
}
