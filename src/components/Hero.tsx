"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import type { CSSProperties, PointerEvent, ReactNode } from "react";
import Portrait from "./Portrait";
import { StatusChip } from "./Chips";
import { FameDisc, MomentumBadge } from "./Scores";
import { TokenChip } from "./Token";
import { avatarBg, portraitOf } from "@/data/portraits";
import type { CardData } from "@/lib/data";
import { compact } from "@/lib/format";

// The supporting cast: #2 and #3 flanking the cover star. Kept to two so the
// cover reads at a glance.
const CAST = [
  { left: "63%", bottom: "0%", width: "w-[44%] sm:w-[33%]", z: "z-20", depth: 18, hideMobile: false },
  { left: "-4%", bottom: "0%", width: "w-[44%] sm:w-[33%]", z: "z-20", depth: 18, hideMobile: false },
];

/** Magazine-cover hero: the characters answer the headline. */
export default function Hero({
  lead,
  cast,
  peakLikes,
  asOf,
}: {
  lead: CardData;
  cast: CardData[];
  peakLikes: number | null;
  asOf: string;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const onMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <section
      onPointerMove={onMove}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      className="relative overflow-hidden pt-20"
      style={avatarBg(lead.slug)}
    >
      <div className="grain pointer-events-none absolute inset-0 opacity-60" />

      {/* masthead */}
      <div className="wrap relative z-40 flex items-center justify-between pt-4 font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink/70 sm:pt-6">
        <span>The live index of AI celebrities</span>
        <span className="hidden sm:inline">Issue · {asOf}</span>
      </div>

      {/* stage */}
      <div className="relative mx-auto h-[500px] max-w-[1600px] sm:h-[min(80svh,900px)] sm:min-h-[560px]">
        {/* the headline sits behind the heads */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-x-0 top-[1%] z-0 select-none px-3 text-center"
        >
          <span className="display block whitespace-nowrap text-[16vw] leading-[0.8] text-ink sm:text-[15vw] xl:text-[14rem]">Who owns</span>
          <span className="sr-only">the internet today?</span>
        </motion.h1>
        {/* second line rides in front of the cast, outlined so it reads over faces */}
        <motion.p
          aria-hidden
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="display pointer-events-none absolute inset-x-0 top-[13%] z-40 select-none whitespace-nowrap px-3 text-center text-[8.4vw] leading-[0.85] text-white sm:top-[19%] sm:text-[6.6vw] xl:text-[6.2rem]"
          style={{ WebkitTextStroke: "0.06em #141414", paintOrder: "stroke fill", textShadow: "0 0.07em 0 rgba(20,20,20,0.12)" }}
        >
          the internet today?
        </motion.p>

        {cast.slice(0, CAST.length).map((c, i) => (
          <CastMember key={c.slug} c={c} slot={CAST[i]} x={sx} y={sy} delay={0.2 + i * 0.08} />
        ))}

        {/* cover star */}
        <Layer x={sx} y={sy} depth={8} className="absolute bottom-0 left-[8%] z-30 w-[84%] sm:left-[27%] sm:w-[46%]">
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <Link href={`/c/${lead.slug}/`} className="group relative block aspect-square" aria-label={`${lead.name}, number one`}>
              <Portrait c={lead} variant="cutout" priority className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.02]" />
            </Link>
          </motion.div>
        </Layer>
      </div>

      {/* cover-star bar */}
      <div className="relative z-40 bg-ink text-white">
        <div className="wrap grid items-center gap-5 py-5 md:grid-cols-[1fr_auto] lg:grid-cols-[1fr_auto_minmax(280px,auto)] lg:gap-8">
          <div className="flex items-center gap-4">
            <FameDisc value={lead.fame} size={104} accent={portraitOf(lead.slug).accent} />
            <div className="min-w-0">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-white/60">#01 · Cover star</div>
              <div className="display text-4xl leading-[0.9] sm:text-5xl">{lead.name}</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-white/60">@{lead.handle}</span>
                {peakLikes && <span className="font-mono text-xs text-white/60">· peak post {compact(peakLikes)} likes</span>}
                <StatusChip code={lead.status} solid />
              </div>
            </div>
          </div>
          <MomentumBadge value={lead.momentum} heat={lead.heat} size="sm" />
          <div className="md:col-span-2 lg:col-span-1">
            <TokenChip t={lead.token} dark />
            <div className="mt-3 flex gap-2">
              <Link href="/chart/" className="flex-1 rounded-full bg-white px-4 py-2.5 text-center font-mono text-[11.5px] uppercase tracking-[0.14em] text-ink">
                View the index →
              </Link>
              <Link href="#waitlist" className="flex-1 rounded-full bg-[#C6F432] px-4 py-2.5 text-center font-mono text-[11.5px] uppercase tracking-[0.14em] text-ink">
                Join the waitlist
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Layer({
  x,
  y,
  depth,
  className,
  style,
  children,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  depth: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const tx = useTransform(x, (v) => v * depth);
  const ty = useTransform(y, (v) => v * depth * 0.5);
  return (
    <motion.div style={{ x: tx, y: ty, ...style }} className={className}>
      {children}
    </motion.div>
  );
}

function CastMember({
  c,
  slot,
  x,
  y,
  delay,
}: {
  c: CardData;
  slot: (typeof CAST)[number];
  x: MotionValue<number>;
  y: MotionValue<number>;
  delay: number;
}) {
  return (
    <Layer
      x={x}
      y={y}
      depth={slot.depth}
      className={`absolute ${slot.width} ${slot.z} ${slot.hideMobile ? "hidden sm:block" : ""}`}
      style={{ left: slot.left, bottom: slot.bottom }}
    >
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
        <Link href={`/c/${c.slug}/`} className="group relative block aspect-square">
          <Portrait c={c} variant="cutout" className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:-translate-y-2" />
          <span className="absolute left-1/2 top-[8%] -translate-x-1/2 whitespace-nowrap rounded-full bg-paper/95 px-3 py-1 font-display text-[11px] font-extrabold uppercase shadow-sticker sm:text-sm">
            <span className="text-fire">#{String(c.rank).padStart(2, "0")}</span> {c.name}
          </span>
        </Link>
      </motion.div>
    </Layer>
  );
}
