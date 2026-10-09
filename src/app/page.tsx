import Link from "next/link";
import Hero, { type CoverLine } from "@/components/Hero";
import IndexStrip from "@/components/IndexStrip";
import TopChart from "@/components/TopChart";
import BreakoutCard from "@/components/BreakoutCard";
import Stories from "@/components/Stories";
import Rivalries from "@/components/Rivalries";
import SectionHead from "@/components/SectionHead";
import Marquee from "@/components/Marquee";
import NetworkGraph from "@/components/NetworkGraph";
import CharacterCard from "@/components/CharacterCard";
import { CareerMoment, CoverStory, UniverseStory, type Fact, type ViralStep } from "@/components/Editorial";
import { getData } from "@/lib/live";
import { compact, daysBetween, longDate, shortDate } from "@/lib/format";

// Re-read live user submissions at most every 30 s (the submit route also refreshes at once).
export const revalidate = 30;

export default async function Home() {
  const { AS_OF, breakout, bySlug, characters, edges, meta, ranked, relationshipsOf, rivalries, stories, toCard, universes } = await getData();
  const cards = ranked.map(toCard);
  const lead = ranked[0];

  // ---- cover story: the index leader, facts only ------------------------
  const leadFacts: Fact[] = [
    { label: "Peak post", value: `${compact(lead.maxLikes)} likes`, trust: "OBSERVED" },
    ...(lead.peak?.date && lead.debut.date
      ? [{ label: "Debut → peak", value: `${daysBetween(lead.debut.date, lead.peak.date)} days`, trust: "OBSERVED" as const }]
      : []),
    { label: "Avg likes · 14 days", value: compact(lead.avgLikes14d), trust: "OBSERVED" },
    {
      label: "Momentum rank",
      value: `#${lead.ranks.momentum} of ${ranked.length}`,
      trust: "INFERRED",
    },
  ];

  // ---- universe report: the most internally connected universe -------------
  const handleUni = new Map(characters.map((c) => [c.handle, c.universe]));
  const internal = (id: string) =>
    edges.filter((e) => e.type !== "SAME_UNIVERSE" && handleUni.get(e.source) === id && handleUni.get(e.target) === id).length;
  const rivals = (id: string) =>
    edges.filter((e) => e.type === "RIVAL" && handleUni.get(e.source) === id && handleUni.get(e.target) === id).length;
  const topUni = [...universes]
    .filter((u) => u.id !== "independents")
    .sort((a, b) => internal(b.id) - internal(a.id) || rivals(b.id) - rivals(a.id))[0];
  const uniMembers = topUni.members.map((s) => bySlug(s)!).filter(Boolean);
  const hub = bySlug(topUni.hub)!;
  const record = hub.bio?.match(/Undefeated\s+(\d+-\d+)/i)?.[1];
  const best14 = [...uniMembers].sort((a, b) => (b.topPost14d?.likes ?? 0) - (a.topPost14d?.likes ?? 0))[0];
  const uniFacts: Fact[] = [
    { label: "Characters", value: `${uniMembers.length}`, trust: "OBSERVED" },
    { label: "Combined followers", value: compact(uniMembers.reduce((s, m) => s + m.followers, 0)), trust: "OBSERVED" },
    { label: "Links between them", value: `${internal(topUni.id)}`, trust: "OBSERVED" },
    record
      ? { label: `${hub.name} record`, value: `${record} (bio)`, trust: "OBSERVED" }
      : { label: "Hub", value: hub.name, trust: "INFERRED" },
    ...(best14?.topPost14d?.likes
      ? [{ label: `Best post · 14d`, value: `${compact(best14.topPost14d.likes)} · ${best14.name}`, trust: "OBSERVED" as const }]
      : []),
  ];

  // ---- from 0 to viral: fastest debut-to-million ----------------------------
  const viral = ranked
    .filter((c) => c.peak?.date && c.debut.date && (c.peak.likes ?? 0) >= 1_000_000 && (c.debut.basis ?? "").toLowerCase().includes("full history"))
    .map((c) => ({ c, days: daysBetween(c.debut.date!, c.peak!.date!) }))
    .sort((a, b) => a.days - b.days || (b.c.peak!.likes ?? 0) - (a.c.peak!.likes ?? 0))[0];
  const viralSteps: ViralStep[] = viral
    ? [
        ...viral.c.timeline
          .filter((e) => e.date)
          .slice(0, 4)
          .map((e) => ({ date: e.date, label: e.label, value: e.value, url: e.url })),
        { date: AS_OF, label: `${compact(viral.c.followers)} followers today`, value: null },
      ]
    : [];

  // ---- cover lines ----------------------------------------------------------
  const fall = stories.find((s) => s.id === "biggest-fall")?.items[0];
  const lines: CoverLine[] = [
    { kicker: "Universe report", text: `The ${topUni.name} is taking over`, href: "#universe" },
    ...(fall ? [{ kicker: "Biggest fall", text: `${fall.c.name}: ${fall.stat} since week one`, href: `/c/${fall.c.slug}/` }] : []),
  ];

  const tokenized = ranked
    .filter((c) => c.token.verification === "CONTRACT" || c.token.verification === "PROFILE")
    .sort((a, b) => (a.token.verification === "CONTRACT" ? 0 : 1) - (b.token.verification === "CONTRACT" ? 0 : 1) || a.ranks.index - b.ranks.index);
  const unverifiedTokens = ranked.filter((c) => c.token.verification === "UNVERIFIED").length;

  const linked = new Set(edges.flatMap((e) => [e.source, e.target]));
  const slugOf = new Map(characters.map((c) => [c.handle, c.slug]));
  const graphNodes = characters
    .filter((c) => c.inclusion === "INCLUDED" || linked.has(c.handle))
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      handle: c.handle,
      fame: c.scores.fame,
      momentum: c.scores.momentum,
      heat: c.heat,
      universe: c.universe,
      rank: c.ranks?.index ?? null,
      inclusion: c.inclusion,
      followers: c.followers,
      status: c.status.code,
    }));
  const graphEdges = edges
    .filter((e) => slugOf.has(e.source) && slugOf.has(e.target))
    .map((e) => ({ source: slugOf.get(e.source)!, target: slugOf.get(e.target)!, type: e.type, count: e.count, note: e.note }));

  return (
    <>
      <Hero lead={toCard(lead)} cast={cards.slice(1, 5)} peakLikes={lead.maxLikes} asOf={longDate(AS_OF)} lines={lines} />
      <IndexStrip cards={cards} />

      {/* universe: second on the page */}
      <section id="universe" className="mt-20 scroll-mt-24 sm:mt-28">
        <div className="wrap">
          <SectionHead
            kicker="They all know each other?"
            title="The universe"
            intro="Portraits sized by Fame, pulsing with Momentum, wired by real tags, call-outs and storylines. Hover for a mini profile, click to focus."
            href="/network/"
            cta="Open full screen"
          />
          <NetworkGraph nodes={graphNodes} edges={graphEdges} universes={universes.map(({ id, name, tagline, members }) => ({ id, name, tagline, members }))} height="h-[72vh]" />
        </div>
        <div className="wrap mt-16 sm:mt-24">
          <UniverseStory u={topUni} members={uniMembers} facts={uniFacts} headline={`The ${topUni.name} is taking over`} />
        </div>
      </section>


      {/* ranking */}
      <section className="wrap mt-28 sm:mt-40">
        <SectionHead
          kicker={`${meta.counts.included} ranked · updated ${longDate(AS_OF)}`}
          title={
            <>
              The AI
              <br />
              Top 10
            </>
          }
          href="/chart/"
          cta={`All ${meta.counts.included}`}
        />
        <TopChart cards={cards} limit={10} />
      </section>

      {/* breakout */}
      <section className="mt-28 bg-ink py-20 text-white sm:mt-40 sm:py-28">
        <div className="wrap">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="kicker mb-3 !text-white/60">Who is hot right now</p>
              <h2 className="display text-[14vw] sm:text-8xl lg:text-9xl">
                Breaking
                <br />
                the internet<span className="text-fire">↑</span>
              </h2>
            </div>
            <Link href="/breakout/" className="w-fit rounded-full border-2 border-white px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] hover:bg-white hover:text-ink">
              All breakouts →
            </Link>
          </div>
        </div>
        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 text-ink sm:px-6 lg:px-10">
          {breakout.slice(0, 6).map((c, i) => (
            <div key={c.slug} className="w-[88vw] shrink-0 snap-start sm:w-[720px]">
              <BreakoutCard c={c} place={i + 1} />
            </div>
          ))}
        </div>
      </section>

      {/* editorial */}
      <section className="wrap mt-28 sm:mt-40">
        <CoverStory c={lead} facts={leadFacts} rels={relationshipsOf(lead).filter((r) => r.type !== "SAME_UNIVERSE").slice(0, 4)} />
        <div className="mt-16 sm:mt-24">
          <SectionHead kicker="Auto-generated from the data" title="The week in synthetic fame" />
          <Stories stories={stories} />
        </div>
      </section>

      {/* rivalries */}
      <section className="wrap mt-28 sm:mt-40">
        <SectionHead kicker="They call each other out" title="Rivalries" />
        <Rivalries
          rivalries={rivalries.map((r) => ({
            a: { ...toCard(r.a), degree: r.a.degree },
            b: { ...toCard(r.b), degree: r.b.degree },
            note: r.note,
          }))}
        />
      </section>

      {/* tokens */}
      <section className="mt-28 bg-[#101010] py-20 text-white sm:mt-40 sm:py-28">
        <div className="wrap">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="kicker mb-3 !text-[#C6F432]">◎ Token layer · verified on the character’s own profile</p>
              <h2 className="display text-[13vw] sm:text-8xl lg:text-9xl">
                Tokenized
                <br />
                AI celebrities
              </h2>
              <p className="mt-5 text-white/70">
                {tokenized.length} ranked characters show a token on their own Instagram profile. {unverifiedTokens} more have tickers
                that are only mentioned elsewhere: those stay marked as unverified and are never linked or priced.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-3">
            {tokenized.map((c, i) => (
              <CharacterCard key={c.slug} c={toCard(c)} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* career moment */}
      {viral && (
        <section className="wrap mt-28 sm:mt-40">
          <CareerMoment c={viral.c} steps={viralSteps} days={viral.days} />
        </section>
      )}

      {/* discover */}
      <section className="mt-28 sm:mt-40">
        <div className="wrap mb-8 text-center">
          <p className="display text-balance text-5xl sm:text-7xl">“I didn’t know there were this many AI celebrities.”</p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {["AI humans", "AI animals", "Parody", "Tokenized", "Rising", "Verified"].map((f) => (
              <Link key={f} href="/discover/" className="chip bg-card px-4 py-2 text-[11.5px] shadow-card hover:bg-ink hover:text-white">
                {f}
              </Link>
            ))}
          </div>
          <Link
            href="/discover/"
            className="mt-8 inline-block rounded-full bg-ink px-7 py-4 font-mono text-[13px] uppercase tracking-[0.14em] text-white shadow-lift transition-transform hover:-translate-y-0.5"
          >
            Discover all {meta.counts.included + meta.counts.watchlist} →
          </Link>
          <p className="mt-4 text-sm text-ink/60">
            Missing someone?{" "}
            <Link href="/submit/" className="link-u font-semibold">
              Add an AI celebrity to the index →
            </Link>
          </p>
        </div>
        <Marquee people={ranked} />
      </section>

      {/* methodology, kept small */}
      <section className="wrap mt-24">
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/methodology/" className="panel p-6 transition-all hover:-translate-y-1 hover:shadow-lift">
            <p className="kicker">How we score</p>
            <p className="display mt-2 text-3xl">Methodology →</p>
            <p className="mt-2 text-sm text-ink/60">Fame, Momentum, Distinctiveness and data sufficiency, in plain language.</p>
          </Link>
          <Link href="/sources/" className="panel p-6 transition-all hover:-translate-y-1 hover:shadow-lift">
            <p className="kicker">Every number traced</p>
            <p className="display mt-2 text-3xl">Sources →</p>
            <p className="mt-2 text-sm text-ink/60">{meta.counts.included + meta.counts.watchlist} public Instagram profiles, captured {shortDate(AS_OF)}.</p>
          </Link>
          <Link href="/about/" className="panel p-6 transition-all hover:-translate-y-1 hover:shadow-lift">
            <p className="kicker">House rules</p>
            <p className="display mt-2 text-3xl">About →</p>
            <p className="mt-2 text-sm text-ink/60">Parody is labelled, tokens are never invented, status is never faked.</p>
          </Link>
        </div>
      </section>
    </>
  );
}
