"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Portrait from "./Portrait";
import { IdentityBadge, StatusChip } from "./Chips";
import { FameDisc, HeatBar } from "./Scores";
import { TokenChip } from "./Token";
import { avatarBg, portraitOf } from "@/data/portraits";
import { compact } from "@/lib/format";
import type { CardData } from "@/lib/data";

/**
 * Collectible celebrity card: a mini profile and an asset card in one.
 * `lg` for the top 10, `md` for grids, `row` for compact lists.
 */
export default function CharacterCard({
  c,
  index = 0,
  showRank = true,
  size = "md",
  rank,
}: {
  c: CardData;
  index?: number;
  showRank?: boolean;
  size?: "lg" | "md" | "row";
  rank?: number;
}) {
  const r = rank ?? c.rank;
  if (size === "row") return <RowCard c={c} rank={r} index={index} />;
  const lg = size === "lg";
  const tilt = index % 2 === 0 ? -1 : 1;
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
        className="flex h-full flex-col overflow-hidden rounded-4xl bg-card text-ink shadow-card transition-shadow group-hover:shadow-lift"
      >
        <div className={`relative ${lg ? "aspect-[4/5]" : "aspect-[5/6]"}`}>
          <div className="absolute inset-0 overflow-hidden rounded-t-4xl" style={avatarBg(c.slug)}>
            <div className="grain absolute inset-0 opacity-60" />
            <Portrait c={c} className="absolute inset-x-0 bottom-0 h-[96%] w-full transition-transform duration-500 group-hover:scale-[1.04]" />
          </div>
          {showRank && r && (
            <span
              className={`absolute left-3 top-3 rounded-2xl bg-ink px-3 py-1 font-display font-extrabold leading-none text-white shadow-sticker ${
                lg ? "text-4xl" : "text-xl"
              }`}
            >
              #{String(r).padStart(2, "0")}
            </span>
          )}
          <div className="absolute right-3 top-3">
            <StatusChip code={c.status} solid />
          </div>
          {(c.identity === "PARODY" || c.identity === "COMMUNITY") && (
            <div className="absolute bottom-3 left-3">
              <IdentityBadge identity={c.identity} />
            </div>
          )}
          <div className="absolute bottom-0 right-3 z-10 translate-y-1/3">
            <FameDisc value={c.fame} size={lg ? 84 : 66} accent={portraitOf(c.slug).accent} />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4 pt-4">
          <div className={lg ? "pr-20" : "pr-16"}>
            <h3 className={`display leading-[0.9] ${lg ? "text-[30px]" : "text-[24px]"}`}>{c.name}</h3>
            <p className="mt-1 truncate font-mono text-xs text-muted">@{c.handle}</p>
          </div>
          <HeatBar value={c.momentum} heat={c.heat} />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="chip bg-ink/[0.05]">{compact(c.followers)} followers</span>
            {c.universeName && <span className="chip bg-ink/[0.05] text-ink/70">✺ {c.universeName}</span>}
          </div>
          <div className="mt-auto">
            <TokenChip t={c.token} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function RowCard({ c, rank, index }: { c: CardData; rank: number | null; index: number }) {
  const hasToken = c.token.verification === "CONTRACT" || c.token.verification === "PROFILE";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, delay: (index % 4) * 0.04 }}
    >
      <Link
        href={`/c/${c.slug}/`}
        className="group flex items-center gap-3 rounded-4xl bg-card p-2.5 pr-4 text-ink shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
      >
        <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl sm:h-28 sm:w-28" style={avatarBg(c.slug)}>
          <Portrait c={c} variant="compact" size={512} className="absolute inset-0 h-full w-full transition-transform duration-300 group-hover:scale-110" />
          {rank && (
            <span className="absolute left-1.5 top-1.5 rounded-xl bg-ink px-2 py-0.5 font-display text-base font-extrabold text-white">
              {String(rank).padStart(2, "0")}
            </span>
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="line-clamp-1 font-display text-lg font-extrabold uppercase leading-tight sm:text-xl">{c.name}</span>
          <span className="flex flex-wrap items-center gap-1.5">
            <StatusChip code={c.status} />
            {hasToken && <span className="chip bg-ink text-[#C6F432]">◎ {c.token.ticker ?? "Token"}</span>}
          </span>
          <span className="max-w-[280px]">
            <HeatBar value={c.momentum} heat={c.heat} />
          </span>
        </span>
        <FameDisc value={c.fame} size={58} accent={portraitOf(c.slug).accent} />
      </Link>
    </motion.div>
  );
}
