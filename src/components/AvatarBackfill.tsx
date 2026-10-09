"use client";

import { useState } from "react";

type Step = { added: string[]; skipped: string[]; remaining: number; error?: string };

/** Runs /api/avatars/backfill/ batch by batch until every character has a picture. */
export default function AvatarBackfill() {
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const add = (line: string) => setLog((l) => [...l, line]);

  async function run() {
    setBusy(true);
    setLog([]);
    for (let round = 0; round < 20; round++) {
      let json: Step;
      try {
        const res = await fetch("/api/avatars/backfill/", { method: "POST" });
        json = (await res.json()) as Step;
        if (!res.ok) {
          add(`Error: ${json.error ?? `HTTP ${res.status}`}`);
          break;
        }
      } catch {
        add("Could not reach the server.");
        break;
      }
      if (json.added.length) add(`Saved: ${json.added.map((h) => `@${h}`).join(", ")}`);
      if (json.skipped.length) add(`No picture found: ${json.skipped.map((h) => `@${h}`).join(", ")}`);
      if (json.remaining <= 0 || (!json.added.length && !json.skipped.length)) {
        add("Done. The photos are restyled on GitHub in about a minute and appear on the site without a rebuild.");
        break;
      }
      add(`${json.remaining} left…`);
    }
    setBusy(false);
  }

  return (
    <div className="panel p-6 sm:p-8">
      <button
        onClick={run}
        disabled={busy}
        className="rounded-full bg-ink px-6 py-3.5 font-mono text-[12px] uppercase tracking-[0.14em] text-white disabled:opacity-50"
      >
        {busy ? "Fetching pictures…" : "Fetch missing Instagram avatars"}
      </button>
      {log.length > 0 && (
        <ol className="mt-5 space-y-1.5 font-mono text-sm">
          {log.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
