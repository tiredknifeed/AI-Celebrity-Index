"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import Portrait from "./Portrait";
import { HEAT_STYLE } from "./Chips";
import { avatarBg, portraitOf } from "@/data/portraits";
import type { CardData } from "@/lib/data";
import { STATUS_LABEL } from "@/lib/labels";

const MODES = [
  { key: "index", label: "Index", rank: (c: CardData) => c.rank ?? 99 },
  { key: "fame", label: "Fame", rank: (c: CardData) => c.fameRank ?? 99 },
  { key: "momentum", label: "Momentum", rank: (c: CardData) => c.momentumRank ?? 99 },
] as const;

/** Chart strip: re-sorts like a music chart as it cycles through the three rankings. */
export default function IndexStrip({ cards }: { cards: CardData[] }) {
  const [mode, setMode] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setMode((m) => (m + 1) % MODES.length), 4800);
    return () => clearInterval(t);
  }, [paused]);

  const m = MODES[mode];
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [mode]);
  const rows = useMemo(() => [...cards].sort((a, b) => m.rank(a) - m.rank(b)).slice(0, 5), [cards, m]);

  return (
    <section
      className="relative z-10 bg-ink py-6 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Live index"
    >
      <div className="wrap">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inset-0 animate-pulseRing rounded-full bg-[#C6F432]" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-[#C6F432]" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">Live index · ranked by</span>
          </div>
          <div className="flex gap-1 rounded-full bg-white/10 p-1" role="tablist">
            {MODES.map((x, i) => (
              <button
                key={x.key}
                role="tab"
                aria-selected={i === mode}
                onClick={() => setMode(i)}
                className={`rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                  i === mode ? "bg-white text-ink" : "text-white/70 hover:text-white"
                }`}
              >
                {x.label}
              </button>
            ))}
          </div>
        </div>

        <LayoutGroup>
          <ol ref={listRef} className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
            <AnimatePresence mode="popLayout" initial={false}>
              {rows.map((c, i) => (
                <motion.li
                  key={c.slug}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  className="w-[78vw] shrink-0 snap-start sm:w-[44vw] lg:w-auto"
                >
                  <Link
                    href={`/c/${c.slug}/`}
                    className="group flex items-center gap-3 rounded-3xl bg-white/[0.06] p-3 transition-colors hover:bg-white/[0.12]"
                  >
                    <motion.span
                      key={`${m.key}-${i}`}
                      initial={{ y: 14, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="w-12 shrink-0 font-display text-4xl font-extrabold tabular-nums leading-none"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </motion.span>
                    <span
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl"
                      style={avatarBg(c.slug)}
                    >
                      <Portrait c={c} variant="compact" className="absolute inset-0 h-full w-full" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block font-display text-[15px] font-extrabold uppercase leading-[1.05]">
                        {c.name}
                      </span>
                      <span className="mt-1 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-white/60">
                        <span className={m.key === "fame" ? "text-white" : ""}>F {c.fame.toFixed(1)}</span>
                        <span className={m.key === "momentum" ? "text-white" : ""}>M {c.momentum.toFixed(1)}</span>
                      </span>
                      <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: HEAT_STYLE[c.heat].color }}>
                        {HEAT_STYLE[c.heat].arrow} {STATUS_LABEL[c.status]}
                      </span>
                    </span>
                  </Link>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        </LayoutGroup>
      </div>
    </section>
  );
}
