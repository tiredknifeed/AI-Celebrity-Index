"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Portrait from "./Portrait";
import { HeatChip, IdentityBadge, StatusChip } from "./Chips";
import { portraitOf } from "@/data/portraits";
import { compact } from "@/lib/format";
import type { CardData } from "@/lib/data";

/** Collectible celebrity card. */
export default function CharacterCard({
  c,
  index = 0,
  showRank = true,
}: {
  c: CardData;
  index?: number;
  showRank?: boolean;
}) {
  const spec = portraitOf(c.slug);
  const tilt = index % 2 === 0 ? -1.2 : 1.2;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, rotate: tilt }}
      className="group h-full"
    >
      <Link
        href={`/c/${c.slug}/`}
        className="flex h-full flex-col overflow-hidden rounded-4xl bg-card shadow-card transition-shadow group-hover:shadow-lift"
      >
        <div className="relative aspect-[5/6] overflow-hidden" style={{ background: spec.accent }}>
          <div className="grain absolute inset-0 opacity-60" />
          <div
            aria-hidden
            className="absolute left-1/2 top-[16%] aspect-square w-[78%] -translate-x-1/2 rounded-full bg-white/25"
          />
          <Portrait
            c={c}
            className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
          />
          {showRank && c.rank && (
            <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 font-display text-lg font-extrabold text-white shadow-sticker">
              #{String(c.rank).padStart(2, "0")}
            </span>
          )}
          <div className="absolute right-3 top-3">
            <StatusChip code={c.status} solid />
          </div>
          {c.identity === "PARODY" && (
            <div className="absolute bottom-3 left-3">
              <IdentityBadge identity="PARODY" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <h3 className="display text-[26px] leading-[0.9]">{c.name}</h3>
            <p className="mt-1 truncate font-mono text-xs text-muted">@{c.handle}</p>
          </div>
          <div className="mt-auto grid grid-cols-3 gap-2 border-t border-line pt-3">
            <Stat label="Fame" value={c.fame.toFixed(0)} />
            <Stat label="Momentum" value={c.momentum.toFixed(0)} />
            <Stat label="Followers" value={compact(c.followers)} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <HeatChip heat={c.heat} />
            {c.universeName && <span className="chip bg-ink/[0.05] text-ink/70">✺ {c.universeName}</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="font-display text-2xl font-extrabold tabular-nums leading-none">{value}</div>
    </div>
  );
}
