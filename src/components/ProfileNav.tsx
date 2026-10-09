"use client";

import { useEffect, useState } from "react";
import Portrait from "./Portrait";
import { HEAT_STYLE, StatusChip } from "./Chips";
import { avatarBg } from "@/data/portraits";
import type { Heat, StatusCode } from "@/lib/types";

const SECTIONS = [
  ["overview", "Overview"],
  ["career", "Career"],
  ["network", "Network"],
  ["token", "Token"],
  ["posts", "Posts"],
  ["sources", "Sources"],
] as const;

/** Sticky profile navigation with scroll-spy and, on phones, a score bar. */
export default function ProfileNav({
  accent,
  slug,
  name,
  fame,
  momentum,
  heat,
  status,
}: {
  accent: string;
  slug: string;
  name: string;
  fame: number;
  momentum: number;
  heat: Heat;
  status: StatusCode;
}) {
  const [active, setActive] = useState<string>("overview");
  useEffect(() => {
    const els = SECTIONS.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <nav className="sticky top-[76px] z-30 sm:top-[84px]" aria-label="Profile sections">
      <div className="wrap">
        <div className="rounded-4xl bg-card/90 p-1 shadow-card backdrop-blur">
          {/* phones: who you're looking at, always visible */}
          <div className="flex items-center gap-2 px-2 pb-1 pt-1.5 md:hidden">
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-xl" style={avatarBg(slug)}>
              <Portrait c={{ slug, name }} variant="compact" className="absolute inset-0 h-full w-full" />
            </span>
            <span className="min-w-0 flex-1 truncate font-display text-sm font-extrabold uppercase">{name}</span>
            <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-[10.5px] text-white">★ {fame.toFixed(0)}</span>
            <span className="rounded-full px-2 py-0.5 font-mono text-[10.5px] text-white" style={{ background: HEAT_STYLE[heat].color }}>
              {HEAT_STYLE[heat].arrow} {momentum.toFixed(0)}
            </span>
            <StatusChip code={status} className="!px-2" />
          </div>
          <div className="no-scrollbar flex gap-1 overflow-x-auto">
            {SECTIONS.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className={`shrink-0 rounded-full px-4 py-2 font-mono text-[11.5px] font-medium uppercase tracking-[0.14em] transition-colors ${
                  active === id ? "text-ink" : "text-ink/60 hover:text-ink"
                }`}
                style={active === id ? { background: accent } : undefined}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
