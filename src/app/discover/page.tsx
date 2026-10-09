import type { Metadata } from "next";
import DiscoverGrid from "@/components/DiscoverGrid";
import PageHead from "@/components/PageHead";
import { ranked, toCard, watchlist } from "@/lib/data";

export const metadata: Metadata = { title: "Discover AI celebrities" };

export default function DiscoverPage() {
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
