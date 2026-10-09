"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import type { PointerEvent } from "react";
import Portrait from "./Portrait";
import { CountUp } from "./Scores";
import { portraitOf } from "@/data/portraits";
import type { CardData } from "@/lib/data";
import { compact } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/labels";

// Where the supporting cast sits around #1 (percent of the stage), and how
// strongly each layer reacts to the cursor.
const SLOTS = [
  { left: "78%", top: "0%", size: "w-[22%]", depth: 26, rotate: 6 },
  { left: "-3%", top: "33%", size: "w-[24%]", depth: 18, rotate: -5 },
  { left: "80%", top: "33%", size: "w-[21%]", depth: 22, rotate: 4 },
  { left: "3%", top: "0%", size: "w-[20%]", depth: 32, rotate: -8 },
  { left: "1%", top: "71%", size: "w-[19%]", depth: 14, rotate: 3 },
];

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

  const leadSpec = portraitOf(lead.slug);

  return (
    <section
      onPointerMove={onMove}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      className="relative min-h-[100svh] overflow-hidden pb-10 pt-24 sm:pt-28"
    >
      {/* giant rank numeral */}
      <Layer x={sx} y={sy} depth={-10} className="pointer-events-none absolute -right-[6vw] top-[6vh] select-none">
        <span className="display block text-[46vw] leading-none text-ink/[0.045] md:text-[34vw]">01</span>
      </Layer>

      <div className="wrap relative grid items-center gap-8 lg:grid-cols-12">
        <div className="relative z-20 lg:col-span-5">
          <motion.p
            className="kicker mb-5 flex items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="h-2 w-2 rounded-full bg-live" /> The live index of AI celebrities.
          </motion.p>
          <motion.h1
            className="display text-[17vw] sm:text-[13vw] lg:text-[7.4vw] xl:text-[7rem]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            Who owns
            <br />
            the internet
            <br />
            <span className="relative inline-block">
              today?
              <motion.svg
                viewBox="0 0 300 30"
                className="absolute -bottom-5 left-0 w-full"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
              >
                <motion.path
                  d="M4 20 C80 6 200 6 296 18"
                  fill="none"
                  stroke={leadSpec.accent}
                  strokeWidth={9}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                />
              </motion.svg>
            </span>
          </motion.h1>
          <p className="mt-8 max-w-md text-[17px] leading-relaxed text-ink/75">
            AI characters are becoming internet celebrities. Some go viral overnight, some run whole universes, some
            fight each other. This is where you find out who is big, who is growing, and who knows who.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/chart/"
              className="rounded-full bg-ink px-7 py-4 font-mono text-[13px] font-medium uppercase tracking-[0.14em] text-white shadow-lift transition-transform hover:-translate-y-0.5"
            >
              View the index →
            </Link>
            <Link
              href="/network/"
              className="rounded-full border-2 border-ink px-7 py-[14px] font-mono text-[13px] font-medium uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-white"
            >
              Explore the network
            </Link>
          </div>
          <p className="kicker mt-6">Last updated {asOf}</p>
        </div>

        {/* stage */}
        <div className="relative z-10 mx-auto aspect-[1/1] w-full max-w-[760px] lg:col-span-7">
          {cast.slice(0, SLOTS.length).map((c, i) => (
            <Satellite key={c.slug} c={c} slot={SLOTS[i]} x={sx} y={sy} delay={0.15 + i * 0.08} />
          ))}

          <Layer x={sx} y={sy} depth={10} className="absolute left-[22%] top-[6%] w-[57%]">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link href={`/c/${lead.slug}/`} className="group relative block aspect-[4/5]" aria-label={`${lead.name} profile`}>
                <div
                  className="absolute inset-x-[2%] bottom-0 top-[14%] rounded-[44%_44%_2.5rem_2.5rem] shadow-lift"
                  style={{ background: leadSpec.accent }}
                >
                  <div className="grain absolute inset-0 rounded-[inherit] opacity-70" />
                </div>
                <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden rounded-b-[2.5rem]">
                  <Portrait
                    c={lead}
                    variant="cutout"
                    priority
                    className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
              </Link>
            </motion.div>

            {/* stickers */}
            <motion.div
              className="absolute -right-[4%] top-[18%] rotate-6 rounded-2xl bg-fire px-4 py-2 font-display text-xl font-extrabold uppercase text-white shadow-sticker"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            >
              {lead.status === "BREAKING_OUT" ? "Breakout ↑" : STATUS_LABEL[lead.status]}
            </motion.div>
            {lead.verified && (
              <div className="absolute -left-[5%] top-[30%] hidden -rotate-6 rounded-full bg-white px-3 py-1.5 sm:block font-mono text-xs font-medium uppercase tracking-[0.12em] shadow-sticker">
                ✓ Verified
              </div>
            )}
            {peakLikes && (
              <div className="absolute -left-[8%] bottom-[30%] hidden rotate-[-3deg] rounded-2xl bg-ink px-4 py-3 text-white shadow-sticker sm:block">
                <div className="font-display text-3xl font-extrabold leading-none">{compact(peakLikes)}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/60">likes · peak post</div>
              </div>
            )}
          </Layer>

          {/* data overlay */}
          <Layer x={sx} y={sy} depth={-6} className="absolute bottom-[0%] right-[0%] z-20 hidden w-[min(330px,62%)] lg:block">
            <LeadCard lead={lead} />
          </Layer>
        </div>
        {/* phones: the data card sits under the stage */}
        <div className="relative z-20 -mt-4 lg:hidden">
          <LeadCard lead={lead} />
        </div>
      </div>
    </section>
  );
}

function LeadCard({ lead }: { lead: CardData }) {
  return (
            <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="rounded-4xl bg-paper/95 p-5 shadow-lift ring-1 ring-ink/5 backdrop-blur"
    >
      <div className="flex items-baseline justify-between">
        <span className="display text-5xl">#01</span>
        <span className="kicker">Index leader</span>
      </div>
      <div className="display mt-1 text-[34px] leading-[0.9]">{lead.name}</div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-ink p-3 text-white">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">★ Fame</div>
          <CountUp value={lead.fame} className="font-display text-4xl font-extrabold leading-none" />
        </div>
        <div className="rounded-2xl bg-fire p-3 text-white">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/80">Momentum</div>
          <CountUp value={lead.momentum} className="font-display text-4xl font-extrabold leading-none" />
        </div>
      </div>
    </motion.div>
  );
}

function Layer({
  x,
  y,
  depth,
  className,
  pos,
  children,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  depth: number;
  className?: string;
  pos?: { left: string; top: string };
  children: React.ReactNode;
}) {
  const tx = useTransform(x, (v) => v * depth);
  const ty = useTransform(y, (v) => v * depth);
  return (
    <motion.div style={{ x: tx, y: ty, ...pos }} className={className}>
      {children}
    </motion.div>
  );
}

function Satellite({
  c,
  slot,
  x,
  y,
  delay,
}: {
  c: CardData;
  slot: (typeof SLOTS)[number];
  x: MotionValue<number>;
  y: MotionValue<number>;
  delay: number;
}) {
  const spec = portraitOf(c.slug);
  return (
    <Layer x={x} y={y} depth={slot.depth} className={`absolute ${slot.size}`} pos={{ left: slot.left, top: slot.top }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ rotate: slot.rotate }}
      >
        <Link href={`/c/${c.slug}/`} className="group block animate-floaty" style={{ animationDelay: `${delay * 3}s` }}>
          <div className="relative aspect-[4/5]">
            <div className="absolute inset-x-0 bottom-0 top-[22%] rounded-[2rem] shadow-card" style={{ background: spec.accent }} />
            <div className="absolute inset-0 overflow-hidden rounded-b-[2rem]">
              <Portrait
                c={c}
                variant="cutout"
                className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <span className="absolute -left-2 -top-1 rounded-full bg-ink px-2.5 py-0.5 font-display text-sm font-extrabold text-white shadow-sticker">
              #{String(c.rank).padStart(2, "0")}
            </span>
          </div>
          <div className="mt-2 truncate text-center font-display text-sm font-extrabold uppercase leading-none sm:text-base">
            {c.name}
          </div>
        </Link>
      </motion.div>
    </Layer>
  );
}
