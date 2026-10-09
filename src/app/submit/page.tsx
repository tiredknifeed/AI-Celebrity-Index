import type { Metadata } from "next";
import Link from "next/link";
import PageHead from "@/components/PageHead";
import SubmitForm, { type KnownAccount } from "@/components/SubmitForm";
import { getData } from "@/lib/live";

// Re-read live user submissions at most every 30 s (the submit route also refreshes at once).
export const revalidate = 30;

export const metadata: Metadata = { title: "Add an AI celebrity" };

const FREE = (process.env.SUBMISSIONS_FREE ?? "true").toLowerCase() !== "false";

function priceLabel() {
  if (FREE) return "Free";
  const cents = Number(process.env.SUBMISSION_PRICE_CENTS ?? 4900);
  const cur = (process.env.SUBMISSION_CURRENCY ?? "usd").toUpperCase();
  return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
}

const PAY_STEP = ["Pay once", "Checkout through Stripe. Payment covers the full analysis."] as const;
const FREE_STEP = ["Free for now", "No payment and no account. Public profiles with at least 1,000 followers and 3 posts."] as const;

const STEPS = FREE
  ? ([
      ["Paste the link", "Any public Instagram profile of an AI or fictional character."],
      FREE_STEP,
      ["We pull the data", "Followers, up to 60 recent posts, likes, comments, dates, bio, tags and token signals from the public profile."],
      ["Scores are computed", "Fame and Momentum with exactly the same formulas as every other character, plus links to characters already in the index."],
      ["Live in seconds", "The character is ranked on the site right away, labelled “Added by a user”. Its photo is restyled to match the index a minute later."],
      ["Editors keep watch", "Editors refine the provisional ratings, and remove copycats, real people and spam."],
    ] as const)
  : ([
      ["Paste the link", "Any public Instagram profile of an AI or fictional character."],
      PAY_STEP,
      ["We pull the data", "Followers, up to 60 recent posts, likes, comments, dates, bio, tags and token signals from the public profile."],
      ["Scores are computed", "Fame and Momentum with exactly the same formulas as every other character, plus links to characters already in the index."],
      ["Analyst review", "A person checks it is a real AI character (not a copycat or a real person), rates distinctiveness and assigns a universe."],
      ["Added to the index", "Approved characters get a ranked profile on the next update. You can follow every step on your status page."],
    ] as const);

export default async function SubmitPage() {
  const { characters, dataset, meta } = await getData();
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
          <SubmitForm known={known} price={price} free={FREE} />
        </div>
        <aside className="flex flex-col gap-4 lg:col-span-5">
          <div className="rounded-5xl bg-ink p-6 text-white sm:p-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#C6F432]">{FREE ? "Free during launch" : `One-time · ${price}`}</p>
            <p className="display mt-3 text-5xl">What you get</p>
            <ul className="mt-5 space-y-2.5 text-[15px] text-white/85">
              <li>★ Provisional Fame and Momentum scores</li>
              <li>↗ Peak post, 14-day activity and live status</li>
              <li>✺ Links to characters already in the index</li>
              <li>◎ Token check: contract or ticker on the profile</li>
              <li>◆ {FREE ? "A ranked profile on the site, live in seconds" : "Analyst review for inclusion in the public index"}</li>
            </ul>
            <p className="mt-6 text-xs leading-relaxed text-white/50">
              {FREE ? "Submitting is free while the index grows. " : "Payment covers the analysis. "}Inclusion in the public index depends on the review against the{" "}
              <Link href="/methodology/" className="underline">
                methodology
              </Link>
              : characters must be AI or fictional, public, and not copycats or real people. Scores are never sold or edited.
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
