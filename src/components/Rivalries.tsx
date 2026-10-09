"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import Portrait from "./Portrait";
import { portraitOf } from "@/data/portraits";
import type { CardData } from "@/lib/data";
import { compact } from "@/lib/format";

export interface RivalSide extends CardData {
  degree: number;
}

export interface RivalryData {
  a: RivalSide;
  b: RivalSide;
  note: string | null;
}

const ROWS: { label: string; get: (c: RivalSide) => number; fmt: (n: number) => string; log?: boolean }[] = [
  { label: "Fame", get: (c) => c.fame, fmt: (n) => n.toFixed(1) },
  { label: "Momentum", get: (c) => c.momentum, fmt: (n) => n.toFixed(1) },
  { label: "Followers", get: (c) => c.followers, fmt: compact, log: true },
  { label: "Peak post", get: (c) => c.maxLikes ?? 0, fmt: (n) => `${compact(n)} likes`, log: true },
  { label: "Network links", get: (c) => c.degree, fmt: (n) => `${n}` },
];

/** Cultural comparison of characters that call each other out. Not a bet. */
export default function Rivalries({ rivalries }: { rivalries: RivalryData[] }) {
  const [i, setI] = useState(0);
  const r = rivalries[i];
  if (!r) return null;
  return (
    <div>
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4">
        {rivalries.map((x, j) => (
          <button
            key={`${x.a.slug}-${x.b.slug}`}
            onClick={() => setI(j)}
            className={`shrink-0 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
              j === i ? "bg-ink text-white" : "bg-card shadow-card hover:bg-white"
            }`}
          >
            {x.a.name} <span className="opacity-50">vs</span> {x.b.name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          className="panel overflow-hidden"
        >
          <div className="relative grid grid-cols-2">
            <Side c={r.a} align="left" />
            <Side c={r.b} align="right" />
            <div className="absolute left-1/2 top-1/2 z-10 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ink font-display text-3xl font-extrabold italic text-white shadow-sticker sm:h-28 sm:w-28 sm:text-5xl">
              VS
            </div>
          </div>
          <div className="p-5 sm:p-8">
            {r.note && (
              <p className="mx-auto mb-6 max-w-xl text-center font-display text-lg font-bold leading-snug sm:text-xl">
                “{r.note}”
              </p>
            )}
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {ROWS.map((row) => {
                const va = row.get(r.a);
                const vb = row.get(r.b);
                const f = (v: number) => (row.log ? Math.log10(Math.max(v, 1)) : v);
                const total = f(va) + f(vb) || 1;
                const pa = (f(va) / total) * 100;
                return (
                  <div key={row.label}>
                    <div className="mb-1.5 flex items-baseline justify-between font-mono text-xs">
                      <span className={va >= vb ? "font-semibold" : "text-muted"}>{row.fmt(va)}</span>
                      <span className="kicker">{row.label}</span>
                      <span className={vb >= va ? "font-semibold" : "text-muted"}>{row.fmt(vb)}</span>
                    </div>
                    <div className="flex h-3 overflow-hidden rounded-full bg-ink/[0.06]">
                      <motion.div
                        className="h-full"
                        style={{ background: portraitOf(r.a.slug).accent }}
                        initial={{ width: "50%" }}
                        animate={{ width: `${pa}%` }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      />
                      <div className="h-full w-[3px] bg-paper" />
                      <div className="h-full flex-1" style={{ background: portraitOf(r.b.slug).accent }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-6 text-center text-xs text-muted">
              A cultural comparison of characters who reference each other in posts. Not a prediction, not a bet.
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Side({ c, align }: { c: RivalSide; align: "left" | "right" }) {
  const spec = portraitOf(c.slug);
  return (
    <Link href={`/c/${c.slug}/`} className="group relative block aspect-[4/5] overflow-hidden sm:aspect-[16/11] lg:aspect-[16/9]" style={{ background: spec.accent }}>
      <div className="grain absolute inset-0 opacity-60" />
      <Portrait
        c={c}
        variant="cutout"
        className={`absolute bottom-0 h-[92%] w-full transition-transform duration-500 group-hover:scale-105 ${align === "right" ? "-scale-x-100 group-hover:-scale-x-105" : ""}`}
      />
      <div className={`absolute top-4 ${align === "left" ? "left-4" : "right-4 text-right"}`}>
        <div className="display text-2xl leading-[0.9] sm:text-4xl">{c.name}</div>
        <div className="mt-1 font-mono text-[11px]">#{c.rank} in the index</div>
      </div>
    </Link>
  );
}
