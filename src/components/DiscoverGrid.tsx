"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import CharacterCard from "./CharacterCard";
import type { CardData } from "@/lib/data";

const FILTERS: { key: string; label: string; test: (c: CardData) => boolean }[] = [
  { key: "all", label: "All", test: () => true },
  { key: "humans", label: "AI humans", test: (c) => c.kind === "human" || c.kind === "virtual" },
  { key: "animals", label: "AI animals", test: (c) => c.kind === "animal" },
  { key: "parody", label: "Parody", test: (c) => c.identity === "PARODY" },
  { key: "crypto", label: "Crypto", test: (c) => c.crypto },
  { key: "virtual", label: "Virtual", test: (c) => c.virtual || c.kind === "toon" },
  { key: "verified", label: "Verified", test: (c) => c.verified },
  { key: "tokenized", label: "Tokenized", test: (c) => c.tokenized },
  { key: "active", label: "Active", test: (c) => c.daysSinceLastPost !== null && c.daysSinceLastPost <= 3 },
  { key: "rising", label: "Rising", test: (c) => ["ON FIRE", "HOT", "RISING"].includes(c.heat) },
];

const SORTS = {
  index: { label: "Index", fn: (a: CardData, b: CardData) => (a.rank ?? 999) - (b.rank ?? 999) },
  fame: { label: "Fame", fn: (a: CardData, b: CardData) => b.fame - a.fame },
  momentum: { label: "Momentum", fn: (a: CardData, b: CardData) => b.momentum - a.momentum },
  followers: { label: "Followers", fn: (a: CardData, b: CardData) => b.followers - a.followers },
} as const;

export default function DiscoverGrid({ cards, watch }: { cards: CardData[]; watch: CardData[] }) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<keyof typeof SORTS>("index");
  const [withWatch, setWithWatch] = useState(false);

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.key, cards.filter(f.test).length])), [cards]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/^@/, "");
    const f = FILTERS.find((x) => x.key === filter)!;
    return [...cards, ...(withWatch ? watch : [])]
      .filter(f.test)
      .filter(
        (c) =>
          !t ||
          c.name.toLowerCase().includes(t) ||
          c.handle.toLowerCase().includes(t) ||
          c.characterType.toLowerCase().includes(t) ||
          (c.universeName ?? "").toLowerCase().includes(t),
      )
      .sort(SORTS[sort].fn);
  }, [cards, watch, withWatch, filter, q, sort]);

  return (
    <div>
      <div className="relative mb-5">
        <span className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-2xl" aria-hidden>
          ⌕
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search AI celebrities"
          aria-label="Search AI celebrities"
          className="w-full rounded-full bg-card py-5 pl-16 pr-6 font-display text-xl font-bold uppercase tracking-tight shadow-card outline-none ring-ink/20 placeholder:text-ink/30 focus:ring-2 sm:text-2xl"
        />
      </div>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-4 py-2 font-mono text-[11.5px] uppercase tracking-[0.12em] transition-colors ${
              filter === f.key ? "bg-ink text-white" : "bg-card shadow-card hover:bg-white"
            }`}
          >
            {f.label} <span className="opacity-50">{counts[f.key]}</span>
          </button>
        ))}
      </div>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="kicker">Sort</span>
        <div className="flex gap-1 rounded-full bg-card p-1 shadow-card">
          {(Object.keys(SORTS) as (keyof typeof SORTS)[]).map((k) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] ${sort === k ? "bg-ink text-white" : ""}`}
            >
              {SORTS[k].label}
            </button>
          ))}
        </div>
        <label className="ml-auto flex cursor-pointer items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em]">
          <input type="checkbox" checked={withWatch} onChange={(e) => setWithWatch(e.target.checked)} className="h-4 w-4 accent-ink" />
          Include watchlist ({watch.length})
        </label>
      </div>

      <motion.div layout className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {list.map((c, i) => (
            <motion.div key={c.slug} layout initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}>
              <CharacterCard c={c} index={i} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {list.length === 0 && <p className="py-20 text-center text-lg text-muted">Nobody matches that yet. The internet is still making them.</p>}
    </div>
  );
}
