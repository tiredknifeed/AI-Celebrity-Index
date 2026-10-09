"use client";

import { motion } from "framer-motion";
import type { TimelineEvent, Trust } from "@/lib/types";
import { TrustTag } from "./Chips";

export interface ArcEvent extends Omit<TimelineEvent, "kind"> {
  kind: TimelineEvent["kind"] | "now";
  stage: string;
}

const KIND_STYLE: Record<ArcEvent["kind"], { bg: string; fg: string; icon: string }> = {
  debut: { bg: "#141414", fg: "#fff", icon: "✦" },
  viral: { bg: "#FF8A1F", fg: "#fff", icon: "↗" },
  peak: { bg: "#FF4D1F", fg: "#fff", icon: "★" },
  token: { bg: "#C6F432", fg: "#141414", icon: "◎" },
  collab: { bg: "#18A957", fg: "#fff", icon: "⇄" },
  milestone: { bg: "#5B8DEF", fg: "#fff", icon: "◆" },
  moment: { bg: "#FFFDF8", fg: "#141414", icon: "·" },
  now: { bg: "#F2B705", fg: "#141414", icon: "●" },
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function fmtValue(n: number | null): string | null {
  if (!n) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M likes`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K likes`;
  return `${n} likes`;
}

/** Career story: debut → first viral post → breakout → collab → token → now. */
export default function CareerArc({ events }: { events: ArcEvent[] }) {
  return (
    <ol className="relative mx-auto max-w-5xl">
      <span aria-hidden className="absolute bottom-6 left-[27px] top-6 w-1 rounded-full bg-gradient-to-b from-ink/10 via-ink/25 to-[#F2B705] md:left-1/2 md:-ml-0.5" />
      {events.map((e, i) => {
        const s = KIND_STYLE[e.kind];
        const [, m, d] = (e.date ?? "--").split("-");
        const value = fmtValue(e.value);
        const right = i % 2 === 1;
        return (
          <motion.li
            key={`${e.date}-${i}`}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            className={`relative mb-8 flex items-start gap-5 pl-0 md:mb-10 md:w-1/2 ${right ? "md:ml-auto md:pl-12" : "md:flex-row-reverse md:pr-12 md:text-right"}`}
          >
            <span
              className={`relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl shadow-sticker md:absolute md:top-2 ${
                right ? "md:-left-7" : "md:-right-7"
              }`}
              style={{ background: s.bg, color: s.fg, border: s.bg === "#FFFDF8" ? "2px solid #141414" : undefined }}
              aria-hidden
            >
              {s.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className={`flex items-baseline gap-2 ${right ? "" : "md:justify-end"}`}>
                <span className="display text-5xl leading-none sm:text-6xl">{e.date ? d : "—"}</span>
                <span className="font-mono text-sm text-muted">{e.date ? `${MONTHS[Number(m) - 1]} ${e.date.slice(0, 4)}` : "date unknown"}</span>
              </div>
              <div className="mt-2 rounded-4xl p-5 shadow-card" style={{ background: s.bg === "#141414" ? "#FFFDF8" : s.bg === "#FFFDF8" ? "#FFFDF8" : `${s.bg}22` }}>
                <div className={`flex flex-wrap items-center gap-2 ${right ? "" : "md:justify-end"}`}>
                  <span className="rounded-full px-2.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em]" style={{ background: s.bg, color: s.fg }}>
                    {e.stage}
                  </span>
                  <TrustTag trust={e.status as Trust} />
                </div>
                {value && <div className="display mt-3 text-4xl leading-none">{value}</div>}
                <p className="mt-2 text-[16px] font-semibold leading-snug">{e.label}</p>
                {e.note && <p className="mt-1 text-sm text-ink/60">{e.note}</p>}
                {e.url && (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block font-mono text-[11px] uppercase tracking-[0.12em] underline decoration-ink/30 underline-offset-4"
                  >
                    Source post ↗
                  </a>
                )}
              </div>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
