import Link from "next/link";
import Hero from "@/components/Hero";
import IndexStrip from "@/components/IndexStrip";
import TopChart from "@/components/TopChart";
import BreakoutCard from "@/components/BreakoutCard";
import Stories from "@/components/Stories";
import Rivalries from "@/components/Rivalries";
import SectionHead from "@/components/SectionHead";
import Marquee from "@/components/Marquee";
import UniverseGrid from "@/components/UniverseGrid";
import { FameDisc, MomentumBadge, SubBar } from "@/components/Scores";
import { HEAT_STYLE } from "@/components/Chips";
import { portraitOf } from "@/data/portraits";
import { AS_OF, breakout, HEAT_ORDER, meta, ranked, rivalries, stories, toCard, universes } from "@/lib/data";
import { longDate } from "@/lib/format";

export default function Home() {
  const cards = ranked.map(toCard);
  const lead = ranked[0];
  const fameLeader = [...ranked].sort((a, b) => a.ranks.fame - b.ranks.fame)[0];
  const momLeader = breakout[0];
  const heatCounts = HEAT_ORDER.map((h) => ({ h, n: ranked.filter((c) => c.heat === h).length }));

  return (
    <>
      <Hero lead={toCard(lead)} cast={cards.slice(1, 6)} peakLikes={lead.maxLikes} asOf={longDate(AS_OF)} />
      <IndexStrip cards={cards} />

      {/* the two scores */}
      <section className="wrap mt-24">
        <SectionHead
          kicker="Two numbers, two questions"
          title={
            <>
              Big <span className="text-ink/30">or</span> blowing up?
            </>
          }
          intro="Fame is how big a character already is. Momentum is how much attention is happening right now. The best stories live in the gap between them."
          href="/methodology/"
          cta="How we score"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="panel relative overflow-hidden p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <FameDisc value={fameLeader.scores.fame} size={190} accent={portraitOf(fameLeader.slug).accent} />
              <div>
                <p className="kicker">Fame score · established significance</p>
                <h3 className="display mt-2 text-5xl">Fame</h3>
                <p className="mt-2 text-ink/70">
                  Highest right now:{" "}
                  <Link href={`/c/${fameLeader.slug}/`} className="link-u font-semibold">
                    {fameLeader.name}
                  </Link>
                  , {(fameLeader.followers / 1e6).toFixed(2)}M followers.
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-2.5">
              <SubBar label="Followers" value={fameLeader.scores.fameParts.followers} />
              <SubBar label="Engagement" value={fameLeader.scores.fameParts.engagement} />
              <SubBar label="Viral reach" value={fameLeader.scores.fameParts.viral} />
              <SubBar label="Longevity" value={fameLeader.scores.fameParts.longevity} />
              <SubBar label="Recognizability" value={fameLeader.scores.fameParts.recognizability} />
            </div>
          </div>
          <div className="panel relative overflow-hidden p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <MomentumBadge value={momLeader.scores.momentum} heat={momLeader.heat} />
              <div>
                <p className="kicker">Momentum score · attention now</p>
                <h3 className="display mt-2 text-5xl">Momentum</h3>
                <p className="mt-2 text-ink/70">
                  Hottest right now:{" "}
                  <Link href={`/c/${momLeader.slug}/`} className="link-u font-semibold">
                    {momLeader.name}
                  </Link>
                  , a {((momLeader.topPost14d?.likes ?? 0) / 1e6).toFixed(2)}M-like post in the last 14 days.
                </p>
              </div>
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {heatCounts.map(({ h, n }) => (
                <li key={h} className="rounded-3xl p-3" style={{ background: `${HEAT_STYLE[h].color}22` }}>
                  <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: HEAT_STYLE[h].color }}>
                    {HEAT_STYLE[h].arrow} {h}
                  </div>
                  <div className="font-display text-3xl font-extrabold">{n}</div>
                  <div className="font-mono text-[10px] text-muted">characters</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* top chart */}
      <section className="wrap mt-28">
        <SectionHead
          kicker={`${meta.counts.included} ranked · ${meta.counts.watchlist} on the watchlist`}
          title={
            <>
              The AI
              <br />
              Top 100
            </>
          }
          intro={`The chart has room for 100. ${meta.counts.included} characters qualify so far, and every one of them was checked by hand.`}
          href="/chart/"
          cta={`Full chart (${meta.counts.included})`}
        />
        <TopChart cards={cards} limit={10} />
      </section>

      {/* breakout */}
      <section className="mt-28 bg-ink py-20 text-white">
        <div className="wrap">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="kicker mb-3 !text-white/60">Strongest recent Momentum</p>
              <h2 className="display text-[14vw] sm:text-8xl lg:text-9xl">
                Breaking
                <br />
                the internet<span className="text-fire">↑</span>
              </h2>
            </div>
            <Link
              href="/breakout/"
              className="w-fit rounded-full border-2 border-white px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] hover:bg-white hover:text-ink"
            >
              All breakouts →
            </Link>
          </div>
        </div>
        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 text-ink sm:px-6 lg:px-10">
          {breakout.slice(0, 6).map((c, i) => (
            <div key={c.slug} className="w-[86vw] shrink-0 snap-start sm:w-[640px]">
              <BreakoutCard c={c} place={i + 1} />
            </div>
          ))}
        </div>
      </section>

      {/* editorial */}
      <section className="wrap mt-28">
        <SectionHead kicker="Auto-generated from the data" title="This week in synthetic fame" />
        <Stories stories={stories} />
      </section>

      {/* rivalries */}
      <section className="wrap mt-28">
        <SectionHead
          kicker="They call each other out"
          title="Rivalries"
          intro="Pairs that reference each other as rivals or opponents in their own posts. Compared side by side, for culture, not for odds."
        />
        <Rivalries
          rivalries={rivalries.map((r) => ({
            a: { ...toCard(r.a), degree: r.a.degree },
            b: { ...toCard(r.b), degree: r.b.degree },
            note: r.note,
          }))}
        />
      </section>

      {/* universes */}
      <section className="wrap mt-28">
        <SectionHead
          kicker="They all know each other?"
          title="The universe"
          intro="Characters tag, fight, date and clone each other. Here are the ecosystems we found."
          href="/network/"
          cta="Explore the network"
        />
        <UniverseGrid universes={universes.filter((u) => u.id !== "independents")} />
      </section>

      {/* parade */}
      <section className="mt-28">
        <div className="wrap mb-8 text-center">
          <p className="display text-balance text-5xl sm:text-7xl">
            “I didn’t know there were this many AI celebrities.”
          </p>
          <Link
            href="/discover/"
            className="mt-8 inline-block rounded-full bg-ink px-7 py-4 font-mono text-[13px] uppercase tracking-[0.14em] text-white shadow-lift transition-transform hover:-translate-y-0.5"
          >
            Discover all {meta.counts.included + meta.counts.watchlist} →
          </Link>
        </div>
        <Marquee people={ranked} />
      </section>
    </>
  );
}
