import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import { TrustTag } from "@/components/Chips";
import { AS_OF, dataset } from "@/lib/data";
import { longDate } from "@/lib/format";

export const metadata: Metadata = { title: "Methodology" };

function weights(prefix: string) {
  return dataset.methodology.params.filter((p) => p.key.startsWith(prefix));
}

export default function MethodologyPage() {
  const blocks = [
    {
      id: "fame",
      title: "Fame Score",
      color: "#141414",
      plain:
        "How big a character already is. Mostly audience size and how much their posts usually get liked, plus their single biggest moment, whether they keep posting, how long they have been around and how recognisable they are.",
      params: weights("W_F_"),
    },
    {
      id: "momentum",
      title: "Momentum Score",
      color: "#FF4D1F",
      plain:
        "How much attention is happening right now. It looks only at the last 14 days: recent likes (we take the lower of two averages so a fading account cannot coast), the biggest recent post, posting rhythm, follower growth for new accounts, and how recently they posted.",
      params: weights("W_M_"),
    },
    {
      id: "index",
      title: "Index score",
      color: "#18A957",
      plain:
        "The overall ranking. It blends Fame, Momentum, Distinctiveness and how complete our data is, so a well-documented, distinctive character can outrank a slightly bigger but thinly documented one.",
      params: weights("W_I_"),
    },
  ];
  return (
    <>
      <PageHead
        kicker={`Index methodology · ${longDate(AS_OF)}`}
        title="How we score"
        intro="The AI Celebrity Index is an index methodology, not objective truth. Weights are choices. Here is every one of them, in plain language."
      />
      <section className="wrap grid gap-4 lg:grid-cols-3">
        {blocks.map((b) => (
          <div key={b.id} id={b.id} className="panel scroll-mt-28 p-6 sm:p-8">
            <span className="inline-block h-3 w-10 rounded-full" style={{ background: b.color }} />
            <h2 className="display mt-4 text-4xl">{b.title}</h2>
            <p className="mt-3 leading-relaxed text-ink/75">{b.plain}</p>
            <ul className="mt-6 flex flex-col gap-3">
              {b.params.map((p) => {
                const v = Number(p.value);
                const isFrac = v <= 1;
                return (
                  <li key={p.key}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm leading-snug">{p.description.replace(/^(Fame|Momentum|Index candidate) weight - /, "")}</span>
                      <span className="font-display text-2xl font-extrabold">{isFrac ? `${Math.round(v * 100)}%` : v}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-ink/10">
                      <div className="h-full rounded-full" style={{ width: `${isFrac ? v * 100 : v}%`, background: b.color }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <section className="wrap mt-4 grid gap-4 lg:grid-cols-2">
        <div id="distinctiveness" className="panel scroll-mt-28 p-6 sm:p-8">
          <h2 className="display text-4xl">Distinctiveness</h2>
          <p className="mt-3 leading-relaxed text-ink/75">
            Four analyst ratings from 0 to 5: how recognisable the look is, how clear the personality is, how much lore there is,
            and how much the character interacts with other characters. Added up and scaled to 100. This is the most subjective
            part of the index, and it is labelled as such everywhere.
          </p>
        </div>
        <div id="sufficiency" className="panel scroll-mt-28 p-6 sm:p-8">
          <h2 className="display text-4xl">Data sufficiency</h2>
          <p className="mt-3 leading-relaxed text-ink/75">
            Five checks, each YES (1), PARTIAL (0.5) or NO (0): is the identity clear, do we have enough posts for Fame, are there
            recent dated posts, did we load the full history, and did we observe links to other characters. The average is the
            sufficiency score. Thin data pulls the index score down instead of being guessed.
          </p>
        </div>
      </section>

      <section className="wrap mt-4">
        <div className="panel p-6 sm:p-8">
          <h2 className="display text-4xl">Labels you will see</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div>
              <TrustTag trust="OBSERVED" />
              <p className="mt-2 text-sm text-ink/75">Seen directly on Instagram: profile, captions, tags, counts.</p>
            </div>
            <div>
              <TrustTag trust="INFERRED" />
              <p className="mt-2 text-sm text-ink/75">
                An analyst interpretation of observed material, or a rule applied to it (relationship types, current phase, status).
              </p>
            </div>
            <div>
              <TrustTag trust="UNKNOWN" />
              <p className="mt-2 text-sm text-ink/75">Not verifiable from Instagram, such as tickers reported only by press.</p>
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <p className="kicker mb-2">Momentum labels</p>
              <p className="text-sm text-ink/75">
                ON FIRE 80+ · HOT 68+ · RISING 58+ · STEADY 45+ · COOLING 25+ · DORMANT below 25.
              </p>
            </div>
            <div>
              <p className="kicker mb-2">Live status</p>
              <p className="text-sm text-ink/75">
                From the latest captured post, never faked as realtime. Active today = posted on the capture day. Posting = within 3
                days. Breaking out = posting and in a hot or rising phase. Cooling = a decaying phase or 2+ weeks quiet. Dormant = no
                post for over 30 days.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap mt-4">
        <div className="panel p-6 sm:p-8">
          <h2 className="display text-4xl">Definitions</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink/80">
            {dataset.methodology.definitions.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
