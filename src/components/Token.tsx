"use client";

import { useState } from "react";
import type { TokenCard } from "@/lib/data";
import { pricePath, usd, useMarket, type Market } from "@/lib/market";

function pct(n: number | null) {
  if (n === null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function Sparkline({ m, width = 96, height = 28, stroke }: { m: Market; width?: number; height?: number; stroke?: string }) {
  const pts = pricePath(m);
  if (!pts) return null;
  const t0 = pts[0].t;
  const vs = pts.map((p) => p.v);
  const lo = Math.min(...vs);
  const hi = Math.max(...vs);
  const X = (t: number) => ((t - t0) / (0 - t0)) * (width - 4) + 2;
  const Y = (v: number) => (hi === lo ? height / 2 : height - 3 - ((v - lo) / (hi - lo)) * (height - 6));
  const d = pts.map((p, i) => `${i ? "L" : "M"}${X(p.t).toFixed(1)},${Y(p.v).toFixed(1)}`).join(" ");
  const up = (m.change.h24 ?? 0) >= 0;
  const color = stroke ?? (up ? "#18A957" : "#E5383B");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label="24-hour price path" role="img">
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={X(0)} cy={Y(pts[pts.length - 1].v)} r={2.6} fill={color} />
    </svg>
  );
}

function open(url: string) {
  return (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };
}

/** Token strip inside cards. Lives inside a <Link>, so its button is a span. */
export function TokenChip({ t, dark = false }: { t: TokenCard; dark?: boolean }) {
  const market = useMarket(t.contract);
  const base = dark ? "bg-white/10 text-white" : "bg-ink text-white";
  if (t.verification === "NONE") {
    return <div className={`rounded-2xl px-3 py-2 font-mono text-[10.5px] uppercase tracking-[0.12em] ${dark ? "bg-white/5 text-white/40" : "bg-ink/[0.04] text-muted"}`}>No verified token</div>;
  }
  if (t.verification === "UNVERIFIED") {
    return (
      <div className={`rounded-2xl px-3 py-2 font-mono text-[10.5px] uppercase tracking-[0.12em] ${dark ? "bg-white/5 text-white/60" : "bg-ink/[0.04] text-ink/60"}`}>
        Token status · <span className="font-semibold">unverified</span>
        {t.mention && <span className="normal-case tracking-normal opacity-70"> · reported {t.mention}</span>}
      </div>
    );
  }
  const live = market?.status === "ok" ? market.data : null;
  const ticker = t.ticker ?? (live ? `$${live.symbol}` : null);
  return (
    <div className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${base}`}>
      <div className="min-w-0">
        <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#C6F432]">
          ◎ Token {t.verification === "CONTRACT" ? "· verified CA" : "· on profile"}
        </div>
        <div className="truncate font-display text-lg font-extrabold leading-tight">{ticker ?? "Contract in bio"}</div>
      </div>
      {t.contract && (
        <div className="ml-auto flex items-center gap-2 text-right">
          {live ? (
            <>
              <Sparkline m={live} width={56} height={24} />
              <div>
                <div className="font-mono text-[11px] font-semibold">{usd(live.marketCap ?? live.fdv)}</div>
                <div className={`font-mono text-[10.5px] ${(live.change.h24 ?? 0) >= 0 ? "text-[#4ADE80]" : "text-[#FF7A7A]"}`}>{pct(live.change.h24)} 24h</div>
              </div>
            </>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/50">
              {market?.status === "loading" ? "Loading…" : "Market n/a"}
            </span>
          )}
        </div>
      )}
      {t.url && (
        <span
          role="link"
          tabIndex={0}
          onClick={open(t.url)}
          onKeyDown={(e) => e.key === "Enter" && open(t.url!)(e)}
          className={`${t.contract ? "" : "ml-auto"} shrink-0 cursor-pointer rounded-full bg-[#C6F432] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ink hover:brightness-95`}
        >
          pump.fun ↗
        </span>
      )}
    </div>
  );
}

/** Full token module for the profile page. */
export function TokenModule({ t, profileNote }: { t: TokenCard; profileNote: string | null }) {
  const market = useMarket(t.contract);
  const [copied, setCopied] = useState(false);
  const [chart, setChart] = useState(false);
  const live = market?.status === "ok" ? market.data : null;

  if (t.verification === "NONE" || t.verification === "UNVERIFIED") {
    return (
      <div className="panel bg-paper2 p-6 sm:p-8">
        <p className="kicker">Token status</p>
        <p className="display mt-3 text-5xl text-ink/40 sm:text-6xl">{t.verification === "NONE" ? "No verified token" : "Unverified"}</p>
        <p className="mt-4 max-w-xl text-sm text-ink/70">
          {t.verification === "NONE"
            ? "Nothing token-related was observed on this character’s Instagram profile."
            : `A ticker (${t.mention ?? "unnamed"}) is mentioned outside the character’s own profile, but the profile does not show it. We do not link or price unverified tokens.`}
        </p>
      </div>
    );
  }

  const ticker = t.ticker ?? (live ? `$${live.symbol}` : "Contract in bio");
  const metrics: [string, string, string?][] = live
    ? [
        ["Market cap", usd(live.marketCap ?? live.fdv)],
        ["24h change", pct(live.change.h24), (live.change.h24 ?? 0) >= 0 ? "text-[#0d7a3e]" : "text-[#c0262c]"],
        ["Volume 24h", usd(live.volume24h)],
        ["Liquidity", usd(live.liquidityUsd)],
        ["Price", usd(live.priceUsd)],
        ["Holders", "n/a"],
      ]
    : [];

  return (
    <div className="panel overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-12">
        <div className="relative bg-ink p-6 text-white sm:p-8 lg:col-span-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C6F432]">
            ◎ {t.verification === "CONTRACT" ? "Verified · contract on profile" : "Verified · ticker on profile"}
          </p>
          <p className="display mt-3 text-6xl sm:text-7xl">{ticker}</p>
          {live?.name && <p className="mt-1 font-mono text-xs text-white/60">{live.name} · on-chain name</p>}
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">Chain</dt>
              <dd className="font-display text-xl font-extrabold">{t.chain ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">Venue</dt>
              <dd className="font-display text-xl font-extrabold">pump.fun</dd>
            </div>
          </dl>
          {t.contract ? (
            <div className="mt-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">Contract</p>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(t.contract!).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1600);
                  });
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-2xl bg-white/10 px-3 py-2.5 text-left font-mono text-[12px] hover:bg-white/15"
              >
                <span className="truncate">{t.contract}</span>
                <span className="ml-auto shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-ink">
                  {copied ? "Copied" : "Copy"}
                </span>
              </button>
            </div>
          ) : (
            <p className="mt-5 text-sm text-white/60">{profileNote ?? "The full contract address was not captured from the profile."}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            {t.url && (
              <a
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#C6F432] px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-ink"
              >
                Open on pump.fun ↗
              </a>
            )}
            {live?.pairUrl && (
              <a
                href={live.pairUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/30 px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em]"
              >
                DexScreener ↗
              </a>
            )}
          </div>
        </div>
        <div className="p-6 sm:p-8 lg:col-span-7">
          {t.contract ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="kicker">Live market · fetched in your browser</p>
                {live && <Sparkline m={live} width={120} height={36} />}
              </div>
              {market?.status === "loading" && <p className="mt-6 text-sm text-muted">Loading market data…</p>}
              {market?.status === "error" && (
                <p className="mt-6 rounded-3xl bg-paper p-4 text-sm text-ink/70">
                  Market data unavailable right now ({market.reason}). We never show estimated numbers; use the pump.fun link
                  for the live market.
                </p>
              )}
              {live && (
                <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {metrics.map(([k, v, cls]) => (
                    <div key={k} className="rounded-3xl bg-paper p-4">
                      <dt className="kicker">{k}</dt>
                      <dd className={`font-display text-2xl font-extrabold ${cls ?? ""}`}>{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="mt-5">
                {chart ? (
                  <iframe
                    title="Token chart"
                    src={`https://dexscreener.com/solana/${t.contract}?embed=1&theme=light&info=0&trades=0`}
                    className="h-[420px] w-full rounded-3xl border-0 bg-paper"
                    loading="lazy"
                  />
                ) : (
                  <button
                    onClick={() => setChart(true)}
                    className="w-full rounded-3xl border-2 border-dashed border-ink/15 py-6 font-mono text-xs uppercase tracking-[0.14em] text-ink/60 hover:border-ink/40 hover:text-ink"
                  >
                    Load live chart (DexScreener embed)
                  </button>
                )}
              </div>
              <p className="mt-3 text-[11px] leading-snug text-muted">
                Source: DexScreener public API, requested from your browser{live ? ` at ${new Date(live.fetchedAt).toLocaleTimeString()}` : ""}.
                The sparkline joins DexScreener’s own −24h / −6h / −1h / −5m price changes. Holder counts are not available from this
                source. Not financial advice.
              </p>
            </>
          ) : (
            <div>
              <p className="kicker">Live market</p>
              <p className="mt-3 text-sm text-ink/70">
                Market data needs the full contract address. The profile shows the ticker
                {t.url ? " and a pump.fun link" : ""}, but not the contract, so no prices are shown.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
