"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import Portrait from "./Portrait";
import { portraitOf } from "@/data/portraits";

export interface SearchItem {
  slug: string;
  name: string;
  handle: string;
  rank: number | null;
  universe: string | null;
}

const LINKS = [
  { href: "/chart/", label: "Index", icon: "≡" },
  { href: "/breakout/", label: "Breakout", icon: "↑" },
  { href: "/network/", label: "Network", icon: "✺" },
  { href: "/discover/", label: "Discover", icon: "◎" },
];

export default function Nav({ items, asOf }: { items: SearchItem[]; asOf: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !open && document.activeElement?.tagName !== "INPUT")) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
        <nav className="pointer-events-auto mx-auto flex max-w-[1440px] items-center justify-between gap-3 rounded-full border border-white/60 bg-paper/80 py-2 pl-4 pr-2 shadow-card backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2" aria-label="AI Celebrity Index home">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-sm text-[#C6F432]">★</span>
            <span className="font-display text-[15px] font-extrabold uppercase leading-none tracking-tight">
              AI Celebrity
              <br className="sm:hidden" /> Index
            </span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const active = pathname?.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-full px-4 py-2 font-mono text-[11.5px] font-medium uppercase tracking-[0.14em] transition-colors ${
                    active ? "bg-ink text-white" : "hover:bg-ink/[0.06]"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[10px] uppercase leading-tight tracking-[0.14em] text-muted lg:block">
              Last updated
              <br />
              <span className="text-ink">{asOf}</span>
            </span>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 font-mono text-[11.5px] uppercase tracking-[0.14em] text-white transition-transform hover:scale-[1.03]"
              aria-label="Search AI celebrities"
            >
              <span aria-hidden>⌕</span>
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile: social-app style tab bar */}
      <nav className="fixed inset-x-3 bottom-3 z-50 flex justify-around rounded-full border border-white/60 bg-ink/90 p-1.5 text-white shadow-lift backdrop-blur-xl md:hidden">
        {LINKS.map((l) => {
          const active = pathname?.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-1 flex-col items-center rounded-full py-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] ${
                active ? "bg-white text-ink" : "text-white/80"
              }`}
            >
              <span className="text-base leading-none" aria-hidden>
                {l.icon}
              </span>
              {l.label}
            </Link>
          );
        })}
      </nav>

      <AnimatePresence>{open && <SearchOverlay items={items} onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

function SearchOverlay({ items, onClose }: { items: SearchItem[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/^@/, "");
    const list = t
      ? items.filter((i) => i.name.toLowerCase().includes(t) || i.handle.toLowerCase().includes(t) || (i.universe ?? "").toLowerCase().includes(t))
      : items.filter((i) => i.rank !== null).slice(0, 8);
    return list.slice(0, 12);
  }, [q, items]);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/40 px-3 pt-20 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-2xl overflow-hidden rounded-4xl bg-paper shadow-lift"
        initial={{ y: -20, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: -10, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Search AI celebrities"
      >
        <div className="flex items-center gap-3 border-b border-line px-6 py-5">
          <span className="text-2xl" aria-hidden>
            ⌕
          </span>
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search AI celebrities"
            className="w-full bg-transparent font-display text-2xl font-bold uppercase tracking-tight outline-none placeholder:text-ink/30"
          />
          <button onClick={onClose} className="kicker rounded-full px-2 py-1 hover:bg-ink/5">
            Esc
          </button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="p-6 text-center text-muted">No AI celebrity matches “{q}”.</li>}
          {results.map((i) => (
            <li key={i.slug}>
              <Link href={`/c/${i.slug}/`} onClick={onClose} className="flex items-center gap-4 rounded-3xl p-2 pr-4 hover:bg-white">
                <span
                  className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl"
                  style={{ background: portraitOf(i.slug).accent }}
                >
                  <Portrait c={i} className="absolute inset-0 h-full w-full" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg font-extrabold uppercase leading-tight">{i.name}</span>
                  <span className="block truncate font-mono text-xs text-muted">
                    @{i.handle}
                    {i.universe ? ` · ${i.universe}` : ""}
                  </span>
                </span>
                <span className="font-display text-xl font-extrabold text-ink/40">
                  {i.rank ? `#${String(i.rank).padStart(2, "0")}` : "WATCH"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
