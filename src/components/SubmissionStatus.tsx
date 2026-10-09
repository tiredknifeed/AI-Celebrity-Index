"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type State = "loading" | "unpaid" | "analysing" | "in_review" | "added" | "rejected" | "unconfigured" | "error";

interface Report {
  followers: number | null;
  verified: boolean;
  fame: number | null;
  momentum: number | null;
  maxLikes: number | null;
  avgLikes12: number | null;
  postsAnalysed: number | null;
  lastPost: string | null;
  token: string;
  ticker: string | null;
  links: string[];
}

const STEPS: { key: State; label: string; text: string }[] = [
  { key: "unpaid", label: "Payment", text: "Waiting for Stripe to confirm the payment." },
  { key: "analysing", label: "Analysis", text: "Pulling the public profile and computing the scores. Usually under two minutes." },
  { key: "in_review", label: "Analyst review", text: "An analyst checks the character and rates distinctiveness." },
  { key: "added", label: "In the index", text: "Approved. The profile appears with the next index update." },
];
const ORDER: State[] = ["unpaid", "analysing", "in_review", "added"];

const n = (v: number | null) => (v === null ? "—" : v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : `${v}`);

export default function SubmissionStatus() {
  const [state, setState] = useState<State>("loading");
  const [handle, setHandle] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("session_id");
    if (!id) {
      setState("error");
      setError("This link is missing its checkout session.");
      return;
    }
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const res = await fetch(`/api/submit/status/?session_id=${encodeURIComponent(id)}`, { cache: "no-store" });
        const json = (await res.json()) as { state?: State; handle?: string; report?: Report | null; error?: string };
        if (stop) return;
        if (json.handle) setHandle(json.handle);
        if (json.report) setReport(json.report);
        if (!res.ok && !json.state) {
          setState("error");
          setError(json.error ?? `HTTP ${res.status}`);
        } else setState(json.state ?? "error");
        if (json.state === "unpaid" || json.state === "analysing") timer = setTimeout(poll, 5000);
      } catch {
        if (!stop) {
          setState("error");
          setError("Could not reach the submission service.");
        }
      }
    };
    poll();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, []);

  const reached = ORDER.indexOf(state);
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="panel p-6 sm:p-8 lg:col-span-7">
        <p className="kicker">Submission</p>
        <p className="display mt-2 text-5xl">{handle ? `@${handle}` : "Your submission"}</p>
        {state === "rejected" && (
          <p className="mt-4 rounded-3xl bg-[#FFE4E1] p-4 text-sm text-[#8a1c1c]">
            After review this account was not added to the public index (for example: not an AI character, a copycat, or a real
            person). Your analysis below is still yours.
          </p>
        )}
        {state === "unconfigured" && <p className="mt-4 rounded-3xl bg-paper p-4 text-sm">Paid submissions are not open yet.</p>}
        {state === "error" && <p className="mt-4 rounded-3xl bg-[#FFE4E1] p-4 text-sm text-[#8a1c1c]">{error}</p>}
        <ol className="mt-6 space-y-4">
          {STEPS.map((s, i) => {
            const done = reached > i || state === "added";
            const now = reached === i && state !== "added";
            return (
              <li key={s.key} className="flex gap-4">
                <span
                  className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-xs ${
                    done ? "bg-live text-white" : now ? "animate-pulse bg-fire text-white" : "bg-ink/10 text-muted"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <div>
                  <p className="font-display text-xl font-extrabold uppercase">{s.label}</p>
                  <p className="text-sm text-ink/70">{s.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="rounded-5xl bg-ink p-6 text-white sm:p-8 lg:col-span-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#C6F432]">Provisional analysis</p>
        {report ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(
                [
                  ["Fame", report.fame?.toFixed(1) ?? "—"],
                  ["Momentum", report.momentum?.toFixed(1) ?? "—"],
                  ["Followers", n(report.followers)],
                  ["Peak post", report.maxLikes ? `${n(report.maxLikes)} likes` : "—"],
                  ["Avg likes · 12", n(report.avgLikes12)],
                  ["Posts analysed", report.postsAnalysed ?? "—"],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="rounded-3xl bg-white/[0.07] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">{k}</p>
                  <p className="font-display text-2xl font-extrabold">{v}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-white/70">
              Token: {report.token === "NONE" ? "none on the profile" : `${report.ticker ?? "contract"} (${report.token.toLowerCase()})`}
              {report.links.length > 0 && <> · Linked to {report.links.map((h) => `@${h}`).join(", ")}</>}
            </p>
            <p className="mt-4 text-xs text-white/45">
              Recognizability, distinctiveness and the final index score are set during review, so the public ranking can differ.
            </p>
          </>
        ) : (
          <p className="mt-4 text-sm text-white/60">The report appears here as soon as the analysis is done.</p>
        )}
        <Link href="/chart/" className="mt-6 inline-block rounded-full bg-white px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-ink">
          Back to the index
        </Link>
      </div>
    </div>
  );
}
