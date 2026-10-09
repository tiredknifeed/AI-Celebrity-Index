"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { TimelineEvent, Trust } from "@/lib/types";
import { TrustTag } from "./Chips";

export interface ArcEvent extends Omit<TimelineEvent, "kind"> {
  kind: TimelineEvent["kind"] | "now";
  stage: string;
}

const KIND_STYLE: Record<ArcEvent["kind"], { bg: string; fg: string }> = {
  debut: { bg: "#141414", fg: "#fff" },
  viral: { bg: "#FF8A1F", fg: "#fff" },
  peak: { bg: "#FF4D1F", fg: "#fff" },
  token: { bg: "#F2B705", fg: "#141414" },
  collab: { bg: "#18A957", fg: "#fff" },
  milestone: { bg: "#5B8DEF", fg: "#fff" },
  moment: { bg: "#FFFDF8", fg: "#141414" },
  now: { bg: "#C6F432", fg: "#141414" },
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
function md(iso: string | null): { m: string; d: string } {
  if (!iso) return { m: "", d: "—" };
  const [, m, d] = iso.split("-");
  return { m: MONTHS[Number(m) - 1], d };
}

function fmtValue(n: number | null): string | null {
  if (!n) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M likes`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K likes`;
  return `${n} likes`;
}

/** Editorial career arc: debut → first viral moment → breakthrough → crossovers → now. */
export default function CareerArc({ events }: { events: ArcEvent[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="relative">
      <div className="absolute left-0 right-0 top-[54px] hidden h-[3px] rounded-full bg-ink/10 md:block" />
      <ol className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4">
        {events.map((e, i) => {
          const s = KIND_STYLE[e.kind];
          const { m, d } = md(e.date);
          const isOpen = open === i;
          const value = fmtValue(e.value);
          return (
            <motion.li
              key={`${e.date}-${i}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ type: "spring", stiffness: 260, damping: 24, delay: i * 0.05 }}
              className="w-[230px] shrink-0 snap-start sm:w-[260px]"
            >
              <div className="mb-3 flex items-end gap-2 pl-1">
                <span className="font-mono text-xs text-muted">{m}</span>
                <span className="display text-5xl leading-none">{d}</span>
              </div>
              <div className="relative mb-3 hidden h-3 md:block">
                <span className="absolute left-3 top-0 h-3 w-3 rounded-full ring-4 ring-paper" style={{ background: s.bg === "#FFFDF8" ? "#141414" : s.bg }} />
              </div>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="block w-full rounded-4xl p-5 text-left shadow-card transition-transform hover:-translate-y-1"
                style={{ background: s.bg, color: s.fg }}
              >
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] opacity-80">{e.stage}</span>
                {value && <span className="display mt-2 block text-3xl leading-none">{value}</span>}
                <span className={`mt-2 block text-[15px] font-semibold leading-snug ${isOpen ? "" : "line-clamp-3"}`}>{e.label}</span>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.span
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="block overflow-hidden"
                    >
                      <span className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded bg-white/90 px-1">
                          <TrustTag trust={e.status as Trust} className="!border-0" />
                        </span>
                        {e.note && <span className="opacity-80">{e.note}</span>}
                      </span>
                      {e.url && (
                        <a
                          href={e.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(ev) => ev.stopPropagation()}
                          className="mt-3 inline-block rounded-full bg-white/90 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink"
                        >
                          Open post ↗
                        </a>
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
                <span className="mt-3 block font-mono text-[10px] uppercase tracking-[0.14em] opacity-60">
                  {isOpen ? "Close" : "Tap for detail"}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
