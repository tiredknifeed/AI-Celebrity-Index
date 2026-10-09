"use client";

import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { Heat } from "@/lib/types";
import { HEAT_STYLE } from "./Chips";

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Number that counts up when it scrolls into view. The server-rendered HTML
 * always carries the real value (no "0.0" without JavaScript); the count-up
 * only starts from zero once the browser has taken over.
 */
export function CountUp({
  value,
  digits = 1,
  className = "",
  style,
}: {
  value: number;
  digits?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const armed = useRef(false);

  useIso(() => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    // Hidden elements and ones parked sideways in a carousel may never
    // intersect: they keep the real number instead of animating.
    if (r.width === 0 && r.height === 0) return;
    if (r.right < 0 || r.left > window.innerWidth) return;
    armed.current = true;
    setShown(0);
  }, [reduce]);

  useEffect(() => {
    if (!inView || !armed.current) return;
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setShown(v),
    });
    return () => controls.stop();
  }, [inView, value]);

  useEffect(() => {
    if (!armed.current) setShown(value);
  }, [value]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`} style={style}>
      {shown.toFixed(digits)}
    </span>
  );
}

// 16-point rosette, the Fame Score medal outline.
function rosette(cx: number, cy: number, rOut: number, rIn: number, points = 16) {
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOut : rIn;
    const a = (Math.PI * i) / points - Math.PI / 2;
    d += `${i ? "L" : "M"}${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)} `;
  }
  return d + "Z";
}
const ROSETTE = rosette(50, 50, 50, 45.5);

/**
 * FAME SCORE medal: the site's signature object. Same shape everywhere,
 * from 40px chips to the 220px cover medal.
 */
export function FameDisc({
  value,
  size = 168,
  accent = "#C6F432",
  label = "Fame",
}: {
  value: number;
  size?: number;
  accent?: string;
  label?: string;
}) {
  const r = 37;
  const circ = 2 * Math.PI * r;
  const small = size < 72;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title={`Fame Score ${value.toFixed(1)} / 100`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)]">
        <path d={ROSETTE} fill="#141414" />
        <circle cx={50} cy={50} r={42} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={0.8} />
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={small ? 6 : 4} />
        <motion.circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth={small ? 6 : 4}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={false}
          animate={{ strokeDashoffset: circ * (1 - value / 100) }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          transform="rotate(-90 50 50)"
        />
        {!small && <text x={50} y={22} textAnchor="middle" fontSize={7} fill={accent}>★</text>}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        {!small && (
          <span className="font-mono uppercase tracking-[0.25em] text-white/70" style={{ fontSize: Math.max(8, size * 0.058), marginTop: size * 0.06 }}>
            {label}
          </span>
        )}
        <CountUp
          value={value}
          digits={size >= 120 ? 1 : 0}
          className="font-display font-extrabold leading-none tracking-tight"
          style={{ fontSize: Math.round(size * (small ? 0.36 : 0.29)) }}
        />
        {!small && (
          <span className="font-mono text-white/45" style={{ fontSize: Math.max(8, size * 0.055) }}>
            /100
          </span>
        )}
      </div>
      <span className="sr-only">Fame score {value.toFixed(1)} out of 100</span>
    </div>
  );
}

/** MOMENTUM: energetic badge that pulses when hot. */
export function MomentumBadge({ value, heat, size = "lg" }: { value: number; heat: Heat; size?: "sm" | "lg" }) {
  const s = HEAT_STYLE[heat];
  const hot = heat === "ON FIRE" || heat === "HOT";
  const big = size === "lg";
  const dark = !["RISING", "STEADY", "COOLING", "DORMANT"].includes(heat);
  return (
    <motion.div
      className="relative inline-flex flex-col rounded-3xl px-5 py-4"
      style={{ background: s.color, color: dark ? "#fff" : "#141414" }}
      animate={hot ? { y: [0, -4, 0] } : undefined}
      transition={hot ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
    >
      {hot && (
        <span aria-hidden className="absolute inset-0 rounded-3xl animate-pulseSoft" style={{ background: s.color, opacity: 0.35, zIndex: -1 }} />
      )}
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-80">Momentum</span>
      <span className={`font-display font-extrabold leading-none tracking-tight ${big ? "text-6xl" : "text-3xl"}`}>
        <CountUp value={value} digits={big ? 1 : 0} />
      </span>
      <span className="mt-1 font-mono text-[11px] font-semibold uppercase tracking-[0.15em]">
        {s.arrow} {heat === "ON FIRE" ? "Very hot" : heat}
      </span>
    </motion.div>
  );
}

/** Momentum as a live heat bar: fills to the score, shimmers when hot. */
export function HeatBar({ value, heat, dark = false, showLabel = true }: { value: number; heat: Heat; dark?: boolean; showLabel?: boolean }) {
  const s = HEAT_STYLE[heat];
  const hot = heat === "ON FIRE" || heat === "HOT";
  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className={`font-mono text-[9.5px] uppercase tracking-[0.14em] ${dark ? "text-white/60" : "text-muted"}`}>Momentum</span>
          <span className="flex items-baseline gap-1.5">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: s.color }}>
              {s.arrow} {heat}
            </span>
            <span className="font-display text-xl font-extrabold tabular-nums leading-none">{value.toFixed(0)}</span>
          </span>
        </div>
      )}
      <div className={`relative h-2 overflow-hidden rounded-full ${dark ? "bg-white/15" : "bg-ink/[0.08]"}`}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: hot ? `linear-gradient(90deg, ${s.color}, #FFD23F, ${s.color})` : s.color,
            backgroundSize: hot ? "200% 100%" : undefined,
          }}
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.max(3, value)}%`, backgroundPositionX: hot ? ["0%", "200%"] : undefined }}
          viewport={{ once: true }}
          transition={{
            width: { duration: 1, ease: [0.16, 1, 0.3, 1] },
            backgroundPositionX: hot ? { duration: 2.4, repeat: Infinity, ease: "linear" } : undefined,
          }}
        />
        {hot && (
          <motion.span
            aria-hidden
            className="absolute inset-y-0 w-3 rounded-full bg-white/80 blur-[2px]"
            initial={{ left: "0%" }}
            whileInView={{ left: `${Math.max(3, value) - 2}%`, opacity: [0.9, 0.3, 0.9] }}
            viewport={{ once: true }}
            transition={{ left: { duration: 1, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 1.4, repeat: Infinity } }}
          />
        )}
      </div>
    </div>
  );
}

/** Tiny horizontal bar for 0-1 sub-scores. */
export function SubBar({ label, value, color = "#141414" }: { label: string; value: number | null; color?: string }) {
  const v = value ?? 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-ink/[0.07]">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.round(v * 100)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="w-10 text-right font-mono text-xs tabular-nums">{value === null ? "—" : Math.round(v * 100)}</span>
    </div>
  );
}
