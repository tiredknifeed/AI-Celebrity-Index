"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  ["overview", "Overview"],
  ["career", "Career"],
  ["network", "Network"],
  ["posts", "Posts"],
  ["token", "Token"],
  ["sources", "Sources"],
] as const;

/** Sticky profile navigation with scroll-spy. */
export default function ProfileNav({ accent }: { accent: string }) {
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
        <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-card/90 p-1 shadow-card backdrop-blur">
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
    </nav>
  );
}
