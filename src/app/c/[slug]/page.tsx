import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Portrait, { portraitCredit } from "@/components/Portrait";
import ProfileNav from "@/components/ProfileNav";
import Parallax from "@/components/Parallax";
import CareerArc from "@/components/CareerArc";
import FameHistory from "@/components/FameHistory";
import CharacterCard from "@/components/CharacterCard";
import { TokenChip, TokenModule } from "@/components/Token";
import Linkify from "@/components/Linkify";
import { FameDisc, MomentumBadge, SubBar } from "@/components/Scores";
import { HeatChip, IdentityBadge, StatusChip, TrustTag, identityExplainer } from "@/components/Chips";
import { avatarBg, portraitOf } from "@/data/portraits";
import {
  AS_OF,
  EDGE_COLOR,
  EDGE_LABEL,
  bySlug,
  careerArc,
  ranked,
  relationshipsOf,
  sourcesOf,
  toCard,
  tokenCard,
  universeOf,
} from "@/lib/data";
import { compact, full, longDate, pct, shortDate, stripTrust } from "@/lib/format";
import type { Character } from "@/lib/types";

export function generateStaticParams() {
  return ranked.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = bySlug(slug);
  if (!c) return {};
  return {
    title: `${c.name} (@${c.handle})`,
    description: c.why ?? `${c.name} on the AI Celebrity Index.`,
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = bySlug(slug);
  if (!c || !c.ranks) notFound();
  const spec = portraitOf(c.slug);
  const on = spec.onAccent ?? "#141414";
  const universe = universeOf(c.universe);
  const rels = relationshipsOf(c);
  const srcs = sourcesOf(c);
  const words = c.name.split(" ");
  const nameLines = words.length <= 2 ? words : [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")];
  const longest = Math.max(...nameLines.map((l) => l.length));
  const nameSize = longest > 11 ? "text-[13vw] lg:text-[7.5vw]" : longest > 7 ? "text-[16vw] lg:text-[9vw]" : "text-[20vw] lg:text-[11vw]";
  const momentumBadge = c.ranks.momentum <= 3 ? `#${c.ranks.momentum} Momentum` : c.ranks.fame <= 3 ? `#${c.ranks.fame} Fame` : null;
  const siblings = universe && universe.id !== "independents" ? universe.members.filter((s) => s !== c.slug).map((s) => bySlug(s)!).filter(Boolean) : [];

  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden rounded-b-[3rem] pt-24" style={{ ...avatarBg(c.slug), color: on }}>
        <div className="grain absolute inset-0 opacity-60" />
        <span className="display pointer-events-none absolute -right-4 top-16 select-none text-[40vw] leading-none opacity-[0.09] lg:text-[26vw]" aria-hidden>
          {String(c.ranks.index).padStart(2, "0")}
        </span>
        <div className="wrap relative grid items-end gap-2 lg:min-h-[86svh] lg:grid-cols-12 lg:gap-6">
          <div className="relative z-10 order-2 pb-10 lg:order-1 lg:col-span-6 lg:pb-16">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="chip bg-ink text-white">#{String(c.ranks.index).padStart(2, "0")} Index</span>
              {momentumBadge && <span className="chip bg-fire text-white">{momentumBadge}</span>}
              <IdentityBadge identity={c.identity} long />
              <StatusChip code={c.status.code} solid />
            </div>
            <h1 className={`display ${nameSize}`}>
              {nameLines.map((l, i) => (
                <span key={i} className="block">
                  {l}
                </span>
              ))}
            </h1>
            <a href={c.profileUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block font-mono text-base hover:underline sm:text-lg">
              @{c.handle} ↗
            </a>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StatusChip code={c.status.code} solid className="!px-4 !py-2 !text-[13px]" />
              <span className="font-mono text-xs uppercase tracking-[0.12em] opacity-75">
                Last post {shortDate(c.lastPost)} · {c.posts7d ?? "—"} posts in 7 days
              </span>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <FameDisc value={c.scores.fame} size={150} accent={spec.accent} />
              <MomentumBadge value={c.scores.momentum} heat={c.heat} />
              <div className="rounded-3xl bg-white/85 px-5 py-4 text-ink">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">Followers</div>
                <div className="font-display text-5xl font-extrabold leading-none">{compact(c.followers)}</div>
                <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em]">{universe ? `✺ ${universe.name}` : ""}</div>
              </div>
            </div>
            <a href="#token" className="mt-5 block max-w-md">
              <TokenChip t={tokenCard(c)} />
            </a>
          </div>
          <div className="relative order-1 h-[58vh] lg:order-2 lg:col-span-6 lg:h-[88vh]">
            <Parallax className="absolute inset-0">
              <Portrait c={c} variant="cutout" priority className="absolute inset-x-0 bottom-0 h-full w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.25)]" />
            </Parallax>
            <span className="absolute bottom-4 right-0 rounded-full bg-white/80 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink">
              {portraitCredit(c.slug)}
            </span>
          </div>
        </div>
      </section>

      {c.identity === "PARODY" && (
        <div className="wrap -mt-6 relative z-10">
          <div className="rounded-4xl bg-[#FFE45C] p-5 shadow-card sm:flex sm:items-center sm:gap-5">
            <span className="display text-3xl">Parody / unofficial AI persona</span>
            <p className="mt-2 text-sm leading-snug sm:mt-0">
              {stripTrust(c.parodyOf ?? c.disambiguation)} This index does not imply any affiliation with the person or intellectual property referenced.
            </p>
          </div>
        </div>
      )}

      <div className="h-8" />
      <ProfileNav
        accent={spec.accent}
        slug={c.slug}
        name={c.name}
        fame={c.scores.fame}
        momentum={c.scores.momentum}
        heat={c.heat}
        status={c.status.code}
      />

      {/* ---------------------------------------------------------- overview */}
      <section id="overview" className="wrap scroll-mt-40 pt-12">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="panel p-6 sm:p-8 lg:col-span-7">
            <p className="kicker flex items-center gap-2">
              Bio · verbatim <TrustTag trust="OBSERVED" />
            </p>
            <blockquote className="mt-3 border-l-4 pl-4 text-xl font-semibold leading-snug [overflow-wrap:anywhere] sm:text-2xl" style={{ borderColor: spec.accent }}>
              {(stripTrust(c.bio) || "—").split(" / ").map((line, i) => (
                <span key={i} className={`block ${/\S{25,}/.test(line) ? "mt-1 font-mono text-sm font-normal text-ink/70 sm:text-base" : ""}`}>
                  {line}
                </span>
              ))}
            </blockquote>
            {c.why && (
              <div className="mt-8 rounded-3xl p-5" style={{ background: `${spec.accent}33` }}>
                <p className="kicker mb-1">Why this character matters</p>
                <p className="text-lg font-semibold leading-snug">{stripTrust(c.why)}</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 lg:col-span-5">
            <Stat label="Followers" value={compact(c.followers)} sub={full(c.followers)} />
            <Stat label="Posts" value={c.posts ? `${c.posts}` : "—"} sub={c.fullHistory ? `history: ${c.fullHistory}` : undefined} />
            <Stat label="Avg likes · last 12" value={compact(c.avgLikes)} sub={c.likesHidden ? `${c.likesHidden} posts hide likes` : undefined} />
            <Stat label="Engagement rate" value={pct(c.engagementRate)} sub={c.engagementLevel ?? undefined} />
            <Stat label="Posts / week" value={c.postsPerWeek !== null ? `${c.postsPerWeek}` : "—"} sub={`${c.posts7d ?? "—"} in the last 7 days`} />
            <Stat label="Peak post" value={compact(c.maxLikes)} sub={c.peak?.date ? shortDate(c.peak.date) : undefined} />
            <Stat label="Debut" value={shortDate(c.debut.date)} sub={c.debut.basis ?? undefined} />
            <Stat label="Last post" value={shortDate(c.lastPost)} sub={c.status.basis} />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            ["Personality", c.personality],
            ["Look", c.visualStyle],
            ["Content", c.contentFormat],
          ].map(([label, text]) => (
            <div key={label} className="panel p-6">
              <p className="kicker mb-3">{label}</p>
              <p className="text-[15px] leading-relaxed">
                <Linkify text={text} />
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="panel p-6">
            <div className="flex items-center gap-4">
              <FameDisc value={c.scores.fame} size={96} accent={spec.accent} />
              <div>
                <p className="kicker">#{c.ranks.fame} of {ranked.length}</p>
                <h3 className="display text-3xl">Fame</h3>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <SubBar label="Followers" value={c.scores.fameParts.followers} />
              <SubBar label="Engagement" value={c.scores.fameParts.engagement} />
              <SubBar label="Viral reach" value={c.scores.fameParts.viral} />
              <SubBar label="Consistency" value={c.scores.fameParts.consistency} />
              <SubBar label="Longevity" value={c.scores.fameParts.longevity} />
              <SubBar label="Recognizability" value={c.scores.fameParts.recognizability} />
            </div>
          </div>
          <div className="panel p-6">
            <div className="flex items-center gap-4">
              <MomentumBadge value={c.scores.momentum} heat={c.heat} size="sm" />
              <div>
                <p className="kicker">#{c.ranks.momentum} of {ranked.length}</p>
                <h3 className="display text-3xl">Momentum</h3>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <SubBar label="Recent likes" value={c.scores.momentumParts.engagement} color="#FF4D1F" />
              <SubBar label="Recent viral" value={c.scores.momentumParts.viral} color="#FF4D1F" />
              <SubBar label="Frequency" value={c.scores.momentumParts.frequency} color="#FF4D1F" />
              <SubBar label="Growth" value={c.scores.momentumParts.growth} color="#FF4D1F" />
              <SubBar label="Recency" value={c.scores.momentumParts.recency} color="#FF4D1F" />
            </div>
          </div>
          <div className="panel p-6">
            <p className="kicker">#{c.ranks.distinctiveness} of {ranked.length} · analyst ratings</p>
            <h3 className="display text-3xl">Distinctiveness {c.scores.distinctiveness.toFixed(0)}</h3>
            <ul className="mt-5 flex flex-col gap-3">
              {(
                [
                  ["Visual", c.scores.distinctParts.visual],
                  ["Personality", c.scores.distinctParts.personality],
                  ["Lore", c.scores.distinctParts.lore],
                  ["Cross-character", c.scores.distinctParts.crossCharacter],
                ] as const
              ).map(([l, v]) => (
                <li key={l} className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{l}</span>
                  <span className="flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={`h-3.5 w-3.5 rounded-full ${i < (v ?? 0) ? "bg-ink" : "bg-ink/10"}`} />
                    ))}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-line pt-4">
              <p className="kicker mb-2">Data sufficiency · {(c.scores.sufficiency * 100).toFixed(0)}%</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(c.sufficiency.flags).map(([k, v]) => (
                  <span
                    key={k}
                    className={`chip ${v === "YES" ? "bg-live/15 text-[#0d7a3e]" : v === "PARTIAL" ? "bg-rising/25 text-[#7a5a00]" : "bg-ink/[0.06] text-muted"}`}
                  >
                    {v === "YES" ? "✓" : v === "PARTIAL" ? "◐" : "○"} {k.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- career */}
      <section id="career" className="wrap scroll-mt-40 pt-24">
        <p className="kicker mb-3">Career</p>
        <h2 className="display mb-8 text-6xl sm:text-8xl">Career arc</h2>
        <CareerArc events={careerArc(c)} />
        <div className="panel mt-8 p-5 sm:p-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kicker">Attention over time · not price</p>
              <h3 className="display text-4xl sm:text-5xl">Fame history</h3>
            </div>
            {c.phase && (
              <span className="chip bg-ink text-white">
                Current phase: {c.phase} <span className="opacity-60">· inferred</span>
              </span>
            )}
          </div>
          <FameHistory c={c} accent={spec.accent} asOf={AS_OF} />
          {c.trajectory.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="kicker">
                    <th className="py-2 pr-4 font-normal">Period</th>
                    <th className="py-2 pr-4 font-normal">Posts</th>
                    <th className="py-2 font-normal">Avg likes / post</th>
                  </tr>
                </thead>
                <tbody>
                  {c.trajectory.map((t, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="py-2 pr-4 font-mono text-xs">
                        {t.start ? shortDate(t.start) : "…"} → {t.end ? shortDate(t.end) : "…"}
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs">{t.posts ?? "—"}</td>
                      <td className="py-2 font-display text-lg font-extrabold">{full(t.avgLikes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------- network */}
      <section id="network" className="wrap scroll-mt-40 pt-24">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="kicker mb-3">Who they know · {c.degree} character links</p>
            <h2 className="display text-6xl sm:text-8xl">Network</h2>
          </div>
          <Link
            href={`/network/?focus=${c.slug}`}
            className="w-fit rounded-full border-2 border-ink px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] hover:bg-ink hover:text-white"
          >
            See in the universe →
          </Link>
        </div>
        {rels.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rels.map((r, i) => (
              <RelationCard key={i} r={r} />
            ))}
          </div>
        ) : (
          <div className="panel p-8 text-center text-ink/70">No tags or mentions of other AI characters observed yet.</div>
        )}
        {(c.realPeopleTagged.length > 0 || c.brandsTagged.length > 0 || c.externalLinks.length > 0) && (
          <div className="panel mt-4 p-6">
            <p className="kicker mb-1">Also tagged · props, brands and tools</p>
            <p className="mb-4 text-sm text-muted">
              Real people and brands tagged as storyline props or sponsors. These are not collaborations with those people.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[...c.realPeopleTagged.map((x) => ["person", x]), ...c.brandsTagged.map((x) => ["brand", x])].map(([k, x]) => (
                <span key={`${k}-${x}`} className={`chip ${k === "person" ? "bg-ink/[0.06]" : "bg-white ring-1 ring-ink/10"}`}>
                  {k === "person" ? "◍" : "▢"} {x}
                </span>
              ))}
            </div>
            {c.suggestedNeighbours && (
              <p className="mt-4 text-sm text-ink/70">
                <span className="kicker mr-2">IG suggests</span>
                {c.suggestedNeighbours}
              </p>
            )}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------- token */}
      <section id="token" className="wrap scroll-mt-40 pt-24">
        <p className="kicker mb-3">◎ Token layer · verified only</p>
        <h2 className="display mb-8 text-6xl sm:text-8xl">Token</h2>
        <TokenModule t={tokenCard(c)} profileNote={c.token.note} />
      </section>

      {/* ---------------------------------------------------------- posts */}
      <section id="posts" className="wrap scroll-mt-40 pt-24">
        <p className="kicker mb-3">Receipts</p>
        <h2 className="display mb-8 text-6xl sm:text-8xl">Posts</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {c.topPost && <PostCard title="Biggest post captured" post={c.topPost} accent={spec.accent} big />}
          {c.topPost14d && (!c.topPost || c.topPost14d.url !== c.topPost.url) && (
            <PostCard title="Best post · last 14 days" post={c.topPost14d} accent={spec.accent} />
          )}
          {!c.topPost && c.topPostNote && (
            <div className="panel p-6">
              <p className="kicker mb-2">Biggest post</p>
              <p className="display text-5xl">{compact(c.maxLikes)}</p>
              <p className="mt-2 text-sm text-ink/70">{c.topPostNote}</p>
            </div>
          )}
        </div>
        {c.seed && (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {(
              [
                ["Most successful posts", c.seed.mostSuccessfulPosts],
                ["Notable reels", c.seed.notableReels],
                ["Viral moments", c.seed.viralMoments],
                ["Recurring jokes & themes", c.seed.recurringThemes],
                ["Recent activity", c.seed.recentActivity],
                ["Brand collabs", c.seed.brandCollabs],
              ] as const
            )
              .filter(([, t]) => t)
              .map(([label, t]) => (
                <div key={label} className="panel p-6">
                  <p className="kicker mb-3">{label}</p>
                  <p className="text-[14.5px] leading-relaxed">
                    <Linkify text={t} />
                  </p>
                </div>
              ))}
          </div>
        )}
        {c.notes && (
          <div className="panel mt-4 p-6">
            <p className="kicker mb-2">Analyst notes</p>
            <p className="text-[15px] leading-relaxed">
              <Linkify text={c.notes} />
            </p>
          </div>
        )}
        {c.evidence.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {c.evidence.map((e) => (
              <a
                key={e.url}
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-card px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] shadow-card hover:bg-white"
              >
                {e.label} ↗
              </a>
            ))}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------- sources */}
      <section id="sources" className="wrap scroll-mt-40 pt-24">
        <p className="kicker mb-3">Data trust</p>
        <h2 className="display mb-8 text-6xl sm:text-8xl">Sources</h2>
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="panel p-6 lg:col-span-5">
            <p className="kicker mb-2">Identity</p>
            <div className="flex items-center gap-2">
              <IdentityBadge identity={c.identity} long />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink/75">{identityExplainer(c.identity)}</p>
            {c.disambiguation && (
              <p className="mt-3 text-sm leading-relaxed">
                <span className="kicker mr-2">Disambiguation</span>
                {c.disambiguation}
              </p>
            )}
            {c.copycats && (
              <p className="mt-3 text-sm leading-relaxed">
                <span className="kicker mr-2">Copycats found</span>
                {c.copycats}
              </p>
            )}
            {c.caveat && (
              <p className="mt-3 text-sm leading-relaxed">
                <span className="kicker mr-2">Caveat</span>
                {c.caveat}
              </p>
            )}
            <div className="mt-5 rounded-3xl bg-paper p-4 text-sm">
              <p className="kicker mb-1">Last updated</p>
              <p className="font-display text-2xl font-extrabold">{longDate(AS_OF)}</p>
              <p className="mt-1 text-xs text-muted">Followers and likes are point-in-time snapshots and change hourly for fast-growing accounts.</p>
            </div>
          </div>
          <div className="panel p-6 lg:col-span-7">
            <p className="kicker mb-3">Where the numbers come from</p>
            <ul className="flex flex-col divide-y divide-line">
              <li className="py-3">
                <a href={c.profileUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                  Instagram profile @{c.handle} ↗
                </a>
                <p className="text-sm text-muted">Primary source for followers, posts, likes, comments, dates, bio and tags.</p>
              </li>
              {srcs
                .filter((s) => s.handle !== c.handle)
                .map((s) => (
                  <li key={s.n} className="py-3">
                    <a href={s.url ?? "#"} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                      {s.title} ↗
                    </a>
                    <p className="text-sm text-muted">
                      {s.type} · {s.usedFor}
                    </p>
                  </li>
                ))}
            </ul>
            {c.sufficiency.basis && (
              <details className="mt-4 rounded-3xl bg-paper p-4 text-sm">
                <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.12em]">How sufficient is this data?</summary>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-ink/75">
                  {c.sufficiency.basis.split(" | ").map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      </section>

      {siblings.length > 0 && (
        <section className="wrap pt-24">
          <p className="kicker mb-3">Same universe</p>
          <h2 className="display mb-8 text-5xl sm:text-7xl">More from {universe!.name}</h2>
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
            {siblings.slice(0, 4).map((s, i) => (
              <CharacterCard key={s.slug} c={toCard(s)} index={i} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="panel p-4">
      <div className="kicker">{label}</div>
      <div className="mt-1 font-display text-3xl font-extrabold leading-none sm:text-4xl">{value}</div>
      {sub && <div className="mt-1.5 line-clamp-2 text-[11.5px] leading-snug text-muted">{sub}</div>}
    </div>
  );
}

function RelationCard({ r }: { r: ReturnType<typeof relationshipsOf>[number] }) {
  const o = r.other;
  const spec = portraitOf(o.slug);
  const inner = (
    <>
      <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl" style={avatarBg(o.slug)}>
        <Portrait c={o} variant="compact" className="absolute inset-0 h-full w-full" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="chip text-white" style={{ background: EDGE_COLOR[r.type] }}>
            {EDGE_LABEL[r.type]}
          </span>
          <TrustTag trust={r.status} />
        </span>
        <span className="mt-1.5 block truncate font-display text-xl font-extrabold uppercase">
          {r.direction === "out" ? "→ " : "← "}
          {o.name}
        </span>
        <span className="block text-[13px] leading-snug text-ink/65">
          {r.note}
          {r.count > 1 ? ` · ${r.count}×` : ""}
        </span>
      </span>
    </>
  );
  return o.ranks ? (
    <Link href={`/c/${o.slug}/`} className="panel flex items-center gap-4 p-3 transition-all hover:-translate-y-0.5 hover:shadow-lift">
      {inner}
    </Link>
  ) : (
    <a href={o.profileUrl} target="_blank" rel="noopener noreferrer" className="panel flex items-center gap-4 p-3 opacity-80">
      {inner}
    </a>
  );
}

function PostCard({ title, post, accent, big = false }: { title: string; post: NonNullable<Character["topPost"]>; accent: string; big?: boolean }) {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group panel relative flex flex-col justify-between overflow-hidden p-6 transition-all hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-40 transition-transform group-hover:scale-125" style={{ background: accent }} />
      <div className="relative">
        <p className="kicker flex items-center gap-2">
          {title} <TrustTag trust="OBSERVED" />
        </p>
        <p className={`display mt-3 ${big ? "text-7xl" : "text-6xl"}`}>{compact(post.likes)}</p>
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">
          likes{post.comments ? ` · ${compact(post.comments)} comments` : ""} · {shortDate(post.date)}
        </p>
        {post.caption && <p className="mt-4 text-lg font-semibold leading-snug">“{post.caption}”</p>}
      </div>
      <span className="relative mt-6 font-mono text-xs uppercase tracking-[0.14em]">Open on Instagram ↗</span>
    </a>
  );
}
