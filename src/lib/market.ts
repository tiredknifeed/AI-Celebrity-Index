"use client";

import { useEffect, useState } from "react";

// Live token data, fetched in the visitor's browser from DexScreener's public
// API (CORS-enabled). Only called for contracts shown on a character's own
// profile. Nothing is cached server-side and nothing is ever made up: if the
// request fails, the UI says the data is unavailable.

export interface Market {
  symbol: string;
  name: string;
  priceUsd: number | null;
  marketCap: number | null;
  fdv: number | null;
  volume24h: number | null;
  liquidityUsd: number | null;
  change: { m5: number | null; h1: number | null; h6: number | null; h24: number | null };
  pairUrl: string | null;
  dexId: string | null;
  fetchedAt: number;
}

type State = { status: "loading" } | { status: "ok"; data: Market } | { status: "error"; reason: string };

const TTL = 5 * 60 * 1000;
const inflight = new Map<string, Promise<Market | null>>();

interface Pair {
  baseToken?: { address?: string; symbol?: string; name?: string };
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  priceChange?: { m5?: number; h1?: number; h6?: number; h24?: number };
  url?: string;
  dexId?: string;
}

async function load(contract: string): Promise<Market | null> {
  try {
    const raw = sessionStorage.getItem(`mkt:${contract}`);
    if (raw) {
      const cached = JSON.parse(raw) as Market;
      if (Date.now() - cached.fetchedAt < TTL) return cached;
    }
  } catch {
    /* storage unavailable */
  }
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contract}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { pairs?: Pair[] | null };
  const pairs = (json.pairs ?? []).filter((p) => p.baseToken?.address === contract);
  if (!pairs.length) return null;
  const best = pairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const data: Market = {
    symbol: best.baseToken?.symbol ?? "",
    name: best.baseToken?.name ?? "",
    priceUsd: best.priceUsd ? Number(best.priceUsd) : null,
    marketCap: n(best.marketCap),
    fdv: n(best.fdv),
    volume24h: n(best.volume?.h24),
    liquidityUsd: n(best.liquidity?.usd),
    change: { m5: n(best.priceChange?.m5), h1: n(best.priceChange?.h1), h6: n(best.priceChange?.h6), h24: n(best.priceChange?.h24) },
    pairUrl: best.url ?? null,
    dexId: best.dexId ?? null,
    fetchedAt: Date.now(),
  };
  try {
    sessionStorage.setItem(`mkt:${contract}`, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
  return data;
}

export function useMarket(contract: string | null): State | null {
  const [state, setState] = useState<State | null>(contract ? { status: "loading" } : null);
  useEffect(() => {
    if (!contract) return;
    let alive = true;
    let p = inflight.get(contract);
    if (!p) {
      p = load(contract);
      inflight.set(contract, p);
      p.catch(() => inflight.delete(contract));
    }
    p.then(
      (d) => alive && setState(d ? { status: "ok", data: d } : { status: "error", reason: "No trading pair listed yet" }),
      (e: Error) => alive && setState({ status: "error", reason: e.message || "Request failed" }),
    );
    return () => {
      alive = false;
    };
  }, [contract]);
  return state;
}

/**
 * A price path rebuilt from DexScreener's own % changes (−24h, −6h, −1h,
 * −5m, now). Real data points, not an interpolated chart.
 */
export function pricePath(m: Market): { t: number; v: number }[] | null {
  const p = m.priceUsd;
  if (!p) return null;
  const pts: { t: number; v: number }[] = [];
  const add = (t: number, pct: number | null) => {
    if (pct === null || pct <= -100) return;
    pts.push({ t, v: p / (1 + pct / 100) });
  };
  add(-24 * 60, m.change.h24);
  add(-6 * 60, m.change.h6);
  add(-60, m.change.h1);
  add(-5, m.change.m5);
  pts.push({ t: 0, v: p });
  return pts.length >= 3 ? pts : null;
}

export function usd(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toPrecision(3)}`;
}
