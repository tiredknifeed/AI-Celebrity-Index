"use client";

import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Heat } from "@/lib/types";
import { HEAT_STYLE } from "./Chips";

/** Number that counts up when it scrolls into view. */
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
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setShown(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setShown(v),
    });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`} style={style}>
      {shown.toFixed(digits)}
    </span>
  );
}

/** FAME as a celebrity rating disc. */
export function FameDisc({
  value,
  size = 168,
  accent = "#141414",
  label = "Fame",
}: {
  value: number;
  size?: number;
  accent?: string;
  label?: string;
}) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx={50} cy={50} r={r} fill="#141414" />
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={4} />
        <motion.circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          whileInView={{ strokeDashoffset: circ * (1 - value / 100) }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
        {Array.from({ length: 40 }, (_, i) => (
          <line
            key={i}
            x1={50}
            y1={10}
            x2={50}
            y2={i % 5 === 0 ? 14 : 12}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={0.6}
            transform={`rotate(${i * 9} 50 50)`}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="font-mono uppercase tracking-[0.25em]" style={{ fontSize: Math.max(9, size * 0.065) }}>
          ★ {label}
        </span>
        <CountUp
          value={value}
          digits={size > 120 ? 1 : 0}
          className="font-display font-extrabold leading-none tracking-tight"
          style={{ fontSize: Math.round(size * 0.3) }}
        />
        <span className="font-mono text-white/50" style={{ fontSize: Math.max(9, size * 0.06) }}>
          /100
        </span>
      </div>
      <span className="sr-only">Fame score {value.toFixed(1)} out of 100</span>
    </div>
  );
}

/** MOMENTUM: energetic badge that pulses when hot. */
export function MomentumBadge({
  value,
  heat,
  size = "lg",
}: {
  value: number;
  heat: Heat;
  size?: "sm" | "lg";
}) {
  const s = HEAT_STYLE[heat];
  const hot = heat === "ON FIRE" || heat === "HOT";
  const big = size === "lg";
  return (
    <motion.div
      className="relative inline-flex flex-col rounded-3xl px-5 py-4"
      style={{ background: s.color, color: heat === "RISING" || heat === "STEADY" || heat === "COOLING" || heat === "DORMANT" ? "#141414" : "#fff" }}
      animate={hot ? { y: [0, -4, 0] } : undefined}
      transition={hot ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
    >
      {hot && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-3xl animate-pulseSoft"
          style={{ background: s.color, opacity: 0.35, zIndex: -1 }}
        />
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
