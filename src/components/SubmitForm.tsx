"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { parseInstagram } from "@/lib/submissions/handle";

export interface KnownAccount {
  handle: string;
  name: string;
  slug: string | null;
  state: "INCLUDED" | "WATCHLIST" | "EXCLUDED";
  reason: string | null;
}

export default function SubmitForm({ known, price, free }: { known: KnownAccount[]; price: string; free: boolean }) {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const h = p.get("handle");
    if (h) setUrl(`https://www.instagram.com/${h}/`);
    if (p.get("cancelled")) setNotice("Checkout was cancelled. Nothing was charged.");
  }, []);

  const handle = useMemo(() => parseInstagram(url), [url]);
  const match = useMemo(() => (handle ? known.find((k) => k.handle === handle) ?? null : null), [handle, known]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!handle || match?.state === "INCLUDED") return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/submit/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, email: email || undefined, website: website || undefined }),
      });
      const json = (await res.json().catch(() => ({}))) as { checkoutUrl?: string; id?: string; handle?: string; error?: string; missing?: string[] };
      if (res.ok && json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }
      if (res.ok && json.id && json.handle) {
        window.location.href = `/submit/status/?id=${encodeURIComponent(json.id)}&handle=${encodeURIComponent(json.handle)}`;
        return;
      }
      setError(
        res.status === 503
          ? `Submissions are not open yet. Check back soon.${json.missing?.length ? ` (Site owner: set ${json.missing.join(" and ")} on the server.)` : ""}`
          : (json.error ?? `Something went wrong (HTTP ${res.status}).`),
      );
    } catch {
      setError("Could not reach the submission service.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="panel p-5 sm:p-8">
      <label htmlFor="ig" className="kicker">
        Instagram profile link
      </label>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 font-mono text-sm text-muted">instagram.com/</span>
        <input
          id="ig"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="handle  ·  or paste the full link"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-3xl bg-paper py-5 pl-[150px] pr-5 font-mono text-base outline-none ring-ink/20 focus:ring-2"
        />
      </div>

      <div className="mt-3 min-h-[28px] text-sm">
        {url && !handle && <span className="text-[#c0262c]">That does not look like an Instagram profile link or @handle.</span>}
        {handle && !match && (
          <span className="text-[#0d7a3e]">
            ✓ <span className="font-mono">@{handle}</span> is not in the index yet.
          </span>
        )}
        {match?.state === "INCLUDED" && (
          <span>
            <span className="font-mono">@{handle}</span> is already ranked.{" "}
            <Link href={`/c/${match.slug}/`} className="link-u font-semibold">
              Open {match.name} →
            </Link>
          </span>
        )}
        {match?.state === "WATCHLIST" && (
          <span className="text-[#7a5a00]">
            <span className="font-mono">@{handle}</span> is on the watchlist ({match.reason}). A new analysis re-checks it with fresh data.
          </span>
        )}
        {match?.state === "EXCLUDED" && (
          <span className="text-[#c0262c]">
            <span className="font-mono">@{handle}</span> was reviewed and excluded: {match.reason}
          </span>
        )}
      </div>

      {!free && (
        <>
          <label htmlFor="em" className="kicker mt-4 block">
            Email for the report (optional)
          </label>
          <input
            id="em"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-3xl bg-paper px-5 py-4 font-mono text-base outline-none ring-ink/20 focus:ring-2"
          />
        </>
      )}
      <input
        aria-hidden
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        name="website"
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />

      <button
        type="submit"
        disabled={!handle || match?.state === "INCLUDED" || busy}
        className="mt-6 w-full rounded-full bg-ink px-6 py-4 font-mono text-[13px] font-medium uppercase tracking-[0.14em] text-white transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? (free ? "Analyzing the profile… up to 2 min" : "Opening checkout…") : handle ? `Analyze @${handle} · ${price}` : `Analyze · ${price}`}
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        {free
          ? busy
            ? "Pulling the public profile and computing the scores. Keep this page open."
            : "Free, no account needed. You get a status page with the provisional scores."
          : "Secure checkout by Stripe. You will be redirected to pay."}
      </p>
      {notice && <p className="mt-4 rounded-3xl bg-paper p-4 text-sm">{notice}</p>}
      {error && <p className="mt-4 rounded-3xl bg-[#FFE4E1] p-4 text-sm text-[#8a1c1c]">{error}</p>}
    </form>
  );
}
