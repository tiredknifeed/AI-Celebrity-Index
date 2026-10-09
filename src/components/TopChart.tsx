"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, type PanInfo } from "framer-motion";
import { useMemo, useState } from "react";
import Portrait from "./Portrait";
import { HeatChip, IdentityBadge, StatusChip } from "./Chips";
import { portraitOf } from "@/data/portraits";
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
  const rest = list.slice(3);
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
          {/* podium */}
          <div className="grid gap-4 md:grid-cols-3 md:items-end">
            {podium.map((c, i) => (
              <PodiumCard key={c.slug} c={c} place={i + 1} tab={tab} />
            ))}
          </div>

          {/* rows */}
          <ol className="mt-6 flex flex-col gap-2.5">
            <AnimatePresence initial={false}>
              {rest.map((c, i) => (
                <ChartRow key={c.slug} c={c} place={i + 4} tab={tab} />
              ))}
            </AnimatePresence>
          </ol>
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
  const spec = portraitOf(c.slug);
  const mv = metricValue(c, tab);
  const order = place === 1 ? "md:order-2" : place === 2 ? "md:order-1" : "md:order-3";
  const height = place === 1 ? "md:aspect-[4/5.4]" : "md:aspect-[4/4.6]";
  return (
    <motion.div layout layoutId={`podium-${c.slug}`} transition={{ type: "spring", stiffness: 220, damping: 30 }} className={order}>
      <Link href={`/c/${c.slug}/`} className="group relative block overflow-hidden rounded-5xl shadow-card transition-shadow hover:shadow-lift">
        <div className={`relative aspect-[4/4.4] ${height}`} style={{ background: spec.accent }}>
          <div className="grain absolute inset-0 opacity-60" />
          <span
            className="display pointer-events-none absolute -left-2 -top-6 select-none text-[11rem] leading-none text-white/35 mix-blend-overlay"
            aria-hidden
          >
            {place}
          </span>
          <Portrait
            c={c}
            variant="cutout"
            className="absolute inset-x-0 bottom-0 h-[92%] w-full transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute left-4 top-4 flex flex-col gap-1.5">
            <span className="w-fit rounded-full bg-ink px-3.5 py-1 font-display text-2xl font-extrabold text-white shadow-sticker">
              #{String(place).padStart(2, "0")}
            </span>
            {c.identity === "PARODY" && <IdentityBadge identity="PARODY" />}
          </div>
          <div className="absolute right-4 top-4">
            <StatusChip code={c.status} solid />
          </div>
          <div className="absolute inset-x-3 bottom-3 rounded-4xl bg-paper/95 p-4 backdrop-blur">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="display line-clamp-2 text-[26px] leading-[0.9] sm:text-[30px]">{c.name}</div>
                <div className="mt-1 truncate font-mono text-xs text-muted">@{c.handle}</div>
              </div>
              <div className="text-right">
                <div className="kicker">{mv.label}</div>
                <div className="font-display text-4xl font-extrabold tabular-nums leading-none">{mv.value}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="chip bg-ink text-white">★ {c.fame.toFixed(1)}</span>
              <HeatChip heat={c.heat} />
              <span className="chip bg-ink/[0.06]">{compact(c.followers)} followers</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ChartRow({ c, place, tab }: { c: CardData; place: number; tab: TabKey }) {
  const spec = portraitOf(c.slug);
  const mv = metricValue(c, tab);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
    >
      <Link
        href={`/c/${c.slug}/`}
        className="group grid grid-cols-[44px_64px_1fr_auto] items-center gap-3 rounded-4xl bg-card p-2.5 pr-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift sm:grid-cols-[64px_84px_1fr_repeat(4,minmax(0,auto))] sm:gap-5"
      >
        <motion.span
          key={`${tab}-${place}`}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center font-display text-3xl font-extrabold tabular-nums sm:text-[42px]"
        >
          {String(place).padStart(2, "0")}
        </motion.span>
        <span
          className="relative aspect-square w-16 overflow-hidden rounded-3xl transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 sm:w-[84px]"
          style={{ background: spec.accent }}
        >
          <Portrait c={c} className="absolute inset-0 h-full w-full" />
        </span>
        <span className="min-w-0">
          <span className="line-clamp-2 block font-display text-lg font-extrabold uppercase leading-[1.02] sm:truncate sm:text-2xl">{c.name}</span>
          <span className="block truncate font-mono text-[11.5px] text-muted">
            @{c.handle}
            {c.universeName ? <span className="hidden md:inline"> · ✺ {c.universeName}</span> : null}
          </span>
          <span className="mt-1.5 flex flex-wrap gap-1 sm:hidden">
            <HeatChip heat={c.heat} />
          </span>
        </span>
        <span className="hidden flex-col items-end sm:flex">
          <span className="kicker">Fame</span>
          <span className="flex items-center gap-2">
            <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-ink/10 lg:block">
              <span className="block h-full rounded-full bg-ink" style={{ width: `${c.fame}%` }} />
            </span>
            <span className="font-display text-2xl font-extrabold tabular-nums">{c.fame.toFixed(1)}</span>
          </span>
        </span>
        <span className="hidden flex-col items-end sm:flex">
          <span className="kicker">Momentum</span>
          <span className="flex items-center gap-2">
            <HeatChip heat={c.heat} className="hidden lg:inline-flex" />
            <span className="font-display text-2xl font-extrabold tabular-nums">{c.momentum.toFixed(1)}</span>
          </span>
        </span>
        <span className="hidden flex-col items-end xl:flex">
          <span className="kicker">Followers</span>
          <span className="font-display text-2xl font-extrabold tabular-nums">{compact(c.followers)}</span>
        </span>
        <span className="flex flex-col items-end gap-1">
          <span className="kicker sm:hidden">{mv.label}</span>
          <span className="font-display text-2xl font-extrabold tabular-nums sm:hidden">{mv.value}</span>
          <StatusChip code={c.status} className="hidden sm:inline-flex" />
        </span>
      </Link>
    </motion.li>
  );
}
