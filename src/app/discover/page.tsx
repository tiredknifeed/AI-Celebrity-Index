import type { Metadata } from "next";
import DiscoverGrid from "@/components/DiscoverGrid";
import PageHead from "@/components/PageHead";
import { getData } from "@/lib/live";

// Re-read live user submissions at most every 30 s (the submit route also refreshes at once).
export const revalidate = 30;

export const metadata: Metadata = { title: "Discover AI celebrities" };

export default async function DiscoverPage() {
  const { ranked, toCard, watchlist } = await getData();
  return (
    <>
      <PageHead
        kicker="Discover"
        title={
          <>
            Who is
            <br />
            this character?
          </>
        }
        intro="Dancing uncles, fighting monkeys, sassy grandmothers, a knight-cat with a token. Filter, search, and open anyone."
      />
      <section className="wrap">
        <DiscoverGrid cards={ranked.map(toCard)} watch={watchlist.map(toCard)} />
      </section>
    </>
  );
}
