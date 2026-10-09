import type { Metadata } from "next";
import Link from "next/link";
import PageHead from "@/components/PageHead";
import SubmitForm, { type KnownAccount } from "@/components/SubmitForm";
import { characters, dataset, meta } from "@/lib/data";

export const metadata: Metadata = { title: "Add an AI celebrity" };

function priceLabel() {
  const cents = Number(process.env.SUBMISSION_PRICE_CENTS ?? 4900);
  const cur = (process.env.SUBMISSION_CURRENCY ?? "usd").toUpperCase();
  return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
}

const STEPS = [
  ["Paste the link", "Any public Instagram profile of an AI or fictional character."],
  ["Pay once", "Checkout through Stripe. Payment covers the full analysis."],
  ["We pull the data", "Followers, up to 60 recent posts, likes, comments, dates, bio, tags and token signals from the public profile."],
  ["Scores are computed", "Fame and Momentum with exactly the same formulas as every other character, plus links to characters already in the index."],
  ["Analyst review", "A person checks it is a real AI character (not a copycat or a real person), rates distinctiveness and assigns a universe."],
  ["Added to the index", "Approved characters get a ranked profile on the next update. You can follow every step on your status page."],
] as const;

export default function SubmitPage() {
  const price = priceLabel();
  const known: KnownAccount[] = [
    ...characters.map((c) => ({
      handle: c.handle.toLowerCase(),
      name: c.name,
      slug: c.inclusion === "INCLUDED" ? c.slug : null,
      state: c.inclusion,
      reason: c.caveat,
    })),
    ...dataset.excluded.map((e) => ({ handle: e.handle.toLowerCase(), name: e.name, slug: null, state: "EXCLUDED" as const, reason: e.reason })),
  ];
  return (
    <>
      <PageHead
        kicker={`Grow the index · ${meta.counts.included} characters so far`}
        title={
          <>
            Add an AI
            <br />
            celebrity
          </>
        }
        intro="Know an AI character that should be on the chart? Paste its Instagram link. We analyze the profile with the same methodology as every other character and send it to review for the index."
      />
      <section className="wrap grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SubmitForm known={known} price={price} />
        </div>
        <aside className="flex flex-col gap-4 lg:col-span-5">
          <div className="rounded-5xl bg-ink p-6 text-white sm:p-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#C6F432]">One-time · {price}</p>
            <p className="display mt-3 text-5xl">What you get</p>
            <ul className="mt-5 space-y-2.5 text-[15px] text-white/85">
              <li>★ Provisional Fame and Momentum scores</li>
              <li>↗ Peak post, 14-day activity and live status</li>
              <li>✺ Links to characters already in the index</li>
              <li>◎ Token check: contract or ticker on the profile</li>
              <li>◆ Analyst review for inclusion in the public index</li>
            </ul>
            <p className="mt-6 text-xs leading-relaxed text-white/50">
              Payment covers the analysis. Inclusion in the public index depends on the review against the{" "}
              <Link href="/methodology/" className="underline">
                methodology
              </Link>
              : characters must be AI or fictional, public, and not copycats or real people. Scores are never sold or edited for
              payment.
            </p>
          </div>
        </aside>
      </section>
      <section className="wrap mt-16">
        <h2 className="display mb-8 text-5xl sm:text-6xl">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="panel p-6">
              <span className="display text-5xl text-ink/20">{String(i + 1).padStart(2, "0")}</span>
              <p className="display mt-2 text-2xl">{t}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{d}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
