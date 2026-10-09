import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import BreakoutCard from "@/components/BreakoutCard";
import { breakout } from "@/lib/data";

export const metadata: Metadata = { title: "Breaking the internet" };

export default function BreakoutPage() {
  const hot = breakout.filter((c) => c.scores.momentum >= 58);
  const rest = breakout.filter((c) => c.scores.momentum < 58);
  return (
    <>
      <PageHead
        kicker="Ranked by Momentum"
        title={
          <>
            Breaking
            <br />
            the internet<span className="text-fire">↑</span>
          </>
        }
        intro="Who is getting the most attention right now: recent engagement, the biggest post of the last 14 days, posting rhythm, follower growth and recency."
      />
      <section className="wrap grid gap-5 lg:grid-cols-2">
        {hot.map((c, i) => (
          <BreakoutCard key={c.slug} c={c} place={i + 1} />
        ))}
      </section>
      <section className="wrap mt-16">
        <h2 className="display mb-6 text-5xl">Steady, cooling, dormant</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          {rest.map((c, i) => (
            <BreakoutCard key={c.slug} c={c} place={hot.length + i + 1} />
          ))}
        </div>
      </section>
    </>
  );
}
