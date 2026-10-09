import type { Metadata } from "next";
import Link from "next/link";
import PageHead from "@/components/PageHead";
import { meta } from "@/lib/data";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <PageHead
        kicker="About"
        title={
          <>
            Synthetic fame
            <br />
            deserves a chart
          </>
        }
      />
      <section className="wrap grid gap-4 lg:grid-cols-12">
        <div className="panel p-6 text-lg leading-relaxed sm:p-10 lg:col-span-8">
          <p>
            AI characters are becoming internet celebrities. Some have millions of followers. Some go viral overnight, launch
            tokens, start music careers, or pick fights with each other across accounts.
          </p>
          <p className="mt-5">
            There was no canonical place to see who is big, who is growing, who is hot right now, and who is connected to who.
            The AI Celebrity Index is that place: a ranking, a set of profiles, and a map of the universe, built from public
            Instagram data and checked by hand.
          </p>
          <p className="mt-5">
            It currently ranks {meta.counts.included} characters, watches {meta.counts.watchlist} more, and documents why{" "}
            {meta.counts.excluded} accounts were left out.
          </p>
        </div>
        <div className="flex flex-col gap-4 lg:col-span-4">
          <div className="panel p-6">
            <p className="kicker mb-2">House rules</p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
              <li>Characters first. Numbers second.</li>
              <li>Every claim keeps its label: observed, inferred or unknown.</li>
              <li>Parody personas are marked and never implied to be affiliated.</li>
              <li>Tokens are optional, secondary, and never invented.</li>
              <li>Status comes from real posting activity. No fake “live”.</li>
            </ul>
          </div>
          <Link href="/methodology/" className="panel p-6 transition-all hover:-translate-y-1 hover:shadow-lift">
            <p className="kicker">Read next</p>
            <p className="display mt-2 text-3xl">How we score →</p>
          </Link>
        </div>
      </section>
    </>
  );
}
