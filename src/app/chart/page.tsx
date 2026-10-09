import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import TopChart from "@/components/TopChart";
import { getData } from "@/lib/live";
import { longDate } from "@/lib/format";
import Link from "next/link";

// Re-read live user submissions at most every 30 s (the submit route also refreshes at once).
export const revalidate = 30;

export const metadata: Metadata = { title: "The AI Top 100" };

export default async function ChartPage() {
  const { AS_OF, meta, ranked, toCard, watchlist } = await getData();
  return (
    <>
      <PageHead
        kicker={`The index · updated ${longDate(AS_OF)}`}
        title={
          <>
            The AI
            <br />
            Top 100
          </>
        }
        intro={`${meta.counts.included} AI celebrities qualify for the chart so far. Rank by the overall index, by Fame, by Momentum, or by who is breaking out. On a phone, swipe sideways to switch.`}
      />
      <section className="wrap">
        <TopChart cards={ranked.map(toCard)} />
        <div className="panel mt-10 p-6 sm:p-8">
          <p className="kicker">Not ranked yet</p>
          <h2 className="display mt-2 text-4xl">The watchlist</h2>
          <p className="mt-2 max-w-2xl text-ink/70">
            Characters we reviewed but did not rank, with the reason. They can enter the chart in a later update.
          </p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {watchlist.map((c) => (
              <li key={c.slug} className="rounded-3xl bg-paper p-4">
                <a href={c.profileUrl} target="_blank" rel="noopener noreferrer" className="font-display text-lg font-extrabold uppercase hover:underline">
                  {c.name} ↗
                </a>
                <div className="font-mono text-xs text-muted">@{c.handle}</div>
                <p className="mt-1 text-sm text-ink/70">{c.caveat}</p>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-muted">
            Excluded accounts (copycats, inactive, real people) are listed on the{" "}
            <Link href="/sources/#excluded" className="link-u">
              sources page
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
