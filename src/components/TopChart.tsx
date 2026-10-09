"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, type PanInfo } from "framer-motion";
import { useMemo, useState } from "react";
import Portrait from "./Portrait";
import CharacterCard from "./CharacterCard";
import { IdentityBadge, StatusChip } from "./Chips";
import { FameDisc, HeatBar } from "./Scores";
import { TokenChip } from "./Token";
import { avatarBg, portraitOf } from "@/data/portraits";
import type { CardData } from "@/lib/data";
import { compact } from "@/lib/format";

const TABS = [
  { key: "index", label: "Index", hint: "Fame + Momentum + Distinctiveness + Data" },
  { key: "fame", label: "Fame", hint: "Established cultural size" },
  { key: "momentum", label: "Momentum", hint: "Attention happening now" },
  { key: "breakout", label: "Breakout", hint: "Momentum running ahead of Fame" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function sorted(cards: CardData[], key: TabKey): CardData[] {
  const list = [...cards];
  switch (key) {
    case "fame":
      return list.sort((a, b) => (a.fameRank ?? 99) - (b.fameRank ?? 99));
    case "momentum":
      return list.sort((a, b) => (a.momentumRank ?? 99) - (b.momentumRank ?? 99));
    case "breakout":
      return list.sort((a, b) => b.momentum - b.fame - (a.momentum - a.fame));
    default:
      return list.sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  }
}

export default function TopChart({ cards, limit }: { cards: CardData[]; limit?: number }) {
  const [tab, setTab] = useState<TabKey>("index");
  const list = useMemo(() => sorted(cards, tab).slice(0, limit ?? cards.length), [cards, tab, limit]);
  const podium = list.slice(0, 3);
  const top10 = list.slice(3, 10);
  const lower = list.slice(10);
  const tabIndex = TABS.findIndex((t) => t.key === tab);

  const onPanEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 80 || Math.abs(info.offset.y) > Math.abs(info.offset.x)) return;
    const next = info.offset.x < 0 ? Math.min(TABS.length - 1, tabIndex + 1) : Math.max(0, tabIndex - 1);
    setTab(TABS[next].key);
  };

  return (
    <div>
      <div className="sticky top-[76px] z-30 -mx-4 mb-8 flex items-center gap-3 overflow-x-auto px-4 py-2 no-scrollbar sm:top-[84px]">
        <div className="flex shrink-0 gap-1 rounded-full bg-card p-1 shadow-card" role="tablist" aria-label="Rank by">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`relative rounded-full px-4 py-2 font-mono text-[11.5px] font-medium uppercase tracking-[0.14em] transition-colors ${
                tab === t.key ? "text-white" : "text-ink/70 hover:text-ink"
              }`}
            >
              {tab === t.key && (
                <motion.span layoutId="chart-tab" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 400, damping: 34 }} />
              )}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
        <span className="kicker hidden shrink-0 sm:inline">{TABS[tabIndex].hint}</span>
        <span className="kicker shrink-0 sm:hidden">Swipe ← →</span>
      </div>

      <motion.div onPanEnd={onPanEnd} style={{ touchAction: "pan-y" }}>
        <LayoutGroup id={`chart-${limit ?? "all"}`}>
          {/* podium covers */}
          <div className="grid gap-4 md:grid-cols-3 md:items-end">
            {podium.map((c, i) => (
              <PodiumCard key={c.slug} c={c} place={i + 1} tab={tab} />
            ))}
          </div>

          {/* 4-10: large collectible cards */}
          {top10.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-4">
              <AnimatePresence initial={false} mode="popLayout">
                {top10.map((c, i) => (
                  <motion.div key={c.slug} layout transition={{ type: "spring", stiffness: 260, damping: 30 }} className={i === 0 ? "lg:col-span-1" : ""}>
                    <CharacterCard c={c} size="md" rank={i + 4} index={i} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* 11+: compact cards */}
          {lower.length > 0 && (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <AnimatePresence initial={false} mode="popLayout">
                {lower.map((c, i) => (
                  <motion.div key={c.slug} layout transition={{ type: "spring", stiffness: 260, damping: 30 }}>
                    <CharacterCard c={c} size="row" rank={i + 11} index={i} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </LayoutGroup>
      </motion.div>
    </div>
  );
}

function metricValue(c: CardData, tab: TabKey): { label: string; value: string } {
  switch (tab) {
    case "fame":
      return { label: "Fame", value: c.fame.toFixed(1) };
    case "momentum":
      return { label: "Momentum", value: c.momentum.toFixed(1) };
    case "breakout":
      return { label: "Mom. − Fame", value: `${c.momentum - c.fame >= 0 ? "+" : ""}${(c.momentum - c.fame).toFixed(1)}` };
    default:
      return { label: "Index", value: c.index.toFixed(1) };
  }
}

function PodiumCard({ c, place, tab }: { c: CardData; place: number; tab: TabKey }) {
  const mv = metricValue(c, tab);
  const order = place === 1 ? "md:order-2" : place === 2 ? "md:order-1" : "md:order-3";
  const height = place === 1 ? "md:aspect-[4/6.2]" : "md:aspect-[4/5.5]";
  return (
    <motion.div layout layoutId={`podium-${c.slug}`} transition={{ type: "spring", stiffness: 220, damping: 30 }} className={order}>
      <Link href={`/c/${c.slug}/`} className="group relative block overflow-hidden rounded-5xl shadow-card transition-shadow hover:shadow-lift">
        <div className={`relative aspect-[4/5.6] ${height}`} style={avatarBg(c.slug)}>
          <div className="grain absolute inset-0 opacity-60" />
          <span
            className="display pointer-events-none absolute -right-3 top-6 select-none text-[13rem] leading-none text-white/40"
            aria-hidden
          >
            {place}
          </span>
          <Portrait
            c={c}
            variant="cutout"
            className="absolute inset-x-0 top-[3%] h-[62%] w-full transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute left-4 top-4 flex flex-col gap-1.5">
            <span className="w-fit rounded-2xl bg-ink px-3.5 py-1.5 font-display text-4xl font-extrabold leading-none text-white shadow-sticker">
              #{String(place).padStart(2, "0")}
            </span>
            <StatusChip code={c.status} solid />
            {(c.identity === "PARODY" || c.identity === "COMMUNITY") && <IdentityBadge identity={c.identity} />}
          </div>
          <div className="absolute right-4 top-4">
            <FameDisc value={c.fame} size={place === 1 ? 104 : 88} accent={portraitOf(c.slug).accent} />
          </div>
          <div className="absolute inset-x-3 bottom-3 rounded-4xl bg-paper/95 p-4 backdrop-blur">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="display line-clamp-2 text-[26px] leading-[0.9] sm:text-[32px]">{c.name}</div>
                <div className="mt-1 truncate font-mono text-xs text-muted">
                  @{c.handle} · {compact(c.followers)} followers
                </div>
              </div>
              {tab !== "fame" && tab !== "index" && (
                <div className="text-right">
                  <div className="kicker">{mv.label}</div>
                  <div className="font-display text-3xl font-extrabold tabular-nums leading-none">{mv.value}</div>
                </div>
              )}
            </div>
            <div className="mt-3">
              <HeatBar value={c.momentum} heat={c.heat} />
            </div>
            <div className="mt-3">
              <TokenChip t={c.token} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
