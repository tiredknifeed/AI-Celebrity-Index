"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import CharacterArt from "./CharacterArt";
import { HEAT_STYLE } from "./Chips";
import { avatarBg, portraitOf } from "@/data/portraits";
import { EDGE_COLOR, EDGE_LABEL } from "@/lib/labels";
import type { EdgeType, Heat, Inclusion, StatusCode } from "@/lib/types";
import { StatusChip } from "./Chips";
import { FameDisc, HeatBar } from "./Scores";

export interface GraphNode {
  slug: string;
  name: string;
  handle: string;
  fame: number;
  momentum: number;
  heat: Heat;
  universe: string;
  rank: number | null;
  inclusion: Inclusion;
  followers: number;
  status: StatusCode;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: EdgeType;
  count: number;
  note: string | null;
}

export interface GraphUniverse {
  id: string;
  name: string;
  tagline: string;
  members: string[];
}

type SimNode = GraphNode & SimulationNodeDatum & { r: number };
type SimLink = SimulationLinkDatum<SimNode> & GraphEdge;

const W = 1600;
const H = 1100;

// Hand-placed cluster centres: linked universes sit next to each other.
const CENTERS: Record<string, { x: number; y: number }> = {
  "jean-phil-universe": { x: 600, y: 470 },
  "ai-fight-league": { x: 1060, y: 470 },
  "crypto-ai-animals": { x: 1080, y: 820 },
  "brazil-ai": { x: 1370, y: 700 },
  "higgsfield-network": { x: 560, y: 880 },
  "arab-ai-characters": { x: 240, y: 700 },
  "classic-virtuals": { x: 250, y: 260 },
  "blur-studios": { x: 820, y: 150 },
  "stretchy-universe": { x: 1340, y: 220 },
  independents: { x: 860, y: 1010 },
};

/** Phones see a zoomed-out map they can pan; desktops see it all. */
function homeView(narrow: boolean) {
  if (!narrow) return { k: 1, x: 0, y: 0 };
  const k = 0.6;
  return { k, x: (W / 2) * (1 - k), y: (H / 2) * (1 - k) };
}

function radius(fame: number, inclusion: Inclusion) {
  if (inclusion === "WATCHLIST") return 15;
  return 15 + Math.pow(fame / 80, 1.7) * 42;
}

export default function NetworkGraph({
  nodes,
  edges,
  universes,
  height = "h-[calc(100svh-150px)]",
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  universes: GraphUniverse[];
  /** Tailwind height class for the canvas. */
  height?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const [, setTick] = useState(0);
  const [focusU, setFocusU] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const [smooth, setSmooth] = useState(false);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const [types, setTypes] = useState<Record<EdgeType, boolean>>({
    RIVAL: true,
    STORYLINE: true,
    COLLAB: true,
    MENTION: true,
    SAME_UNIVERSE: true,
  });

  const centers = useMemo(() => {
    const out: Record<string, { x: number; y: number }> = {};
    universes.forEach((u, i) => {
      const a = (i / universes.length) * Math.PI * 2;
      out[u.id] = CENTERS[u.id] ?? { x: W / 2 + Math.cos(a) * 500, y: H / 2 + Math.sin(a) * 340 };
    });
    return out;
  }, [universes]);

  const simNodes = useMemo<SimNode[]>(
    () =>
      nodes.map((n) => {
        const c = centers[n.universe] ?? { x: W / 2, y: H / 2 };
        return { ...n, r: radius(n.fame, n.inclusion), x: c.x + (Math.random() - 0.5) * 80, y: c.y + (Math.random() - 0.5) * 80 };
      }),
    [nodes, centers],
  );
  const simLinks = useMemo<SimLink[]>(() => edges.map((e) => ({ ...e })), [edges]);

  useEffect(() => {
    const sim = forceSimulation<SimNode, SimLink>(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.slug)
          .distance((l) => (l.type === "SAME_UNIVERSE" ? 120 : 110))
          .strength((l) => (l.type === "SAME_UNIVERSE" ? 0.04 : 0.12)),
      )
      .force("charge", forceManyBody<SimNode>().strength(-180).distanceMax(320))
      .force("collide", forceCollide<SimNode>().radius((d) => d.r + 12).strength(0.95))
      .force("x", forceX<SimNode>((d) => centers[d.universe]?.x ?? W / 2).strength(0.16))
      .force("y", forceY<SimNode>((d) => centers[d.universe]?.y ?? H / 2).strength(0.16));
    // Settle most of the layout before the first paint, then let it breathe.
    sim.stop();
    for (let i = 0; i < 220; i++) sim.tick();
    sim.alpha(0.08).restart();
    let frame = 0;
    sim.on("tick", () => {
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          setTick((t) => t + 1);
        });
      }
    });
    simRef.current = sim;
    return () => {
      sim.stop();
      cancelAnimationFrame(frame);
    };
  }, [simNodes, simLinks, centers]);

  // Deep links: /network/?u=ai-fight-league or ?focus=derek-mercer
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const u = p.get("u");
    const f = p.get("focus");
    if (u && universes.some((x) => x.id === u)) setFocusU(u);
    if (f && nodes.some((n) => n.slug === f)) setSelected(f);
  }, [universes, nodes]);

  // Fly to a selected character and its links, an isolated universe, or back out.
  useEffect(() => {
    setSmooth(true);
    const t = setTimeout(() => setSmooth(false), 700);
    let ms: SimNode[] = [];
    if (selected) {
      const keep = new Set([selected]);
      for (const l of simLinks) {
        const a = typeof l.source === "object" ? (l.source as SimNode).slug : (l.source as string);
        const b = typeof l.target === "object" ? (l.target as SimNode).slug : (l.target as string);
        if (a === selected) keep.add(b);
        if (b === selected) keep.add(a);
      }
      ms = simNodes.filter((n) => keep.has(n.slug) && n.x !== undefined);
    } else if (focusU) {
      ms = simNodes.filter((n) => n.universe === focusU && n.x !== undefined);
    }
    if (!ms.length) {
      setView(homeView(narrow));
      return () => clearTimeout(t);
    }
    if (!ms.length) return () => clearTimeout(t);
    const minX = Math.min(...ms.map((n) => n.x! - n.r));
    const maxX = Math.max(...ms.map((n) => n.x! + n.r));
    const minY = Math.min(...ms.map((n) => n.y! - n.r));
    const maxY = Math.max(...ms.map((n) => n.y! + n.r));
    const k = Math.min(2.2, Math.max(1, Math.min(W / (maxX - minX + 360), H / (maxY - minY + 300))));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setView({ k, x: W / 2 - cx * k, y: H / 2 - cy * k });
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusU, selected, narrow]);

  // --------------------------------------------------------------- pointer
  const drag = useRef<{ mode: "node" | "pan"; slug?: string; sx: number; sy: number; moved: boolean; vx: number; vy: number } | null>(null);

  const toGraph = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current!;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
      return { x: (p.x - view.x) / view.k, y: (p.y - view.y) / view.k };
    },
    [view],
  );

  const onNodeDown = (e: RPointerEvent, slug: string) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { mode: "node", slug, sx: e.clientX, sy: e.clientY, moved: false, vx: 0, vy: 0 };
  };
  const onBgDown = (e: RPointerEvent) => {
    drag.current = { mode: "pan", sx: e.clientX, sy: e.clientY, moved: false, vx: view.x, vy: view.y };
  };
  const onMove = (e: RPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 4) d.moved = true;
    if (!d.moved) return;
    if (d.mode === "node" && d.slug) {
      const n = simNodes.find((x) => x.slug === d.slug);
      if (!n) return;
      const p = toGraph(e.clientX, e.clientY);
      n.fx = p.x;
      n.fy = p.y;
      simRef.current?.alphaTarget(0.25).restart();
    } else if (d.mode === "pan") {
      const svg = svgRef.current!;
      const scale = 1 / svg.getScreenCTM()!.a;
      setView((v) => ({ ...v, x: d.vx + (e.clientX - d.sx) * scale, y: d.vy + (e.clientY - d.sy) * scale }));
    }
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.mode === "node" && d.slug) {
      const n = simNodes.find((x) => x.slug === d.slug);
      if (n) {
        n.fx = null;
        n.fy = null;
      }
      simRef.current?.alphaTarget(0);
      if (!d.moved) setSelected((s) => (s === d.slug ? null : d.slug!));
    } else if (d.mode === "pan" && !d.moved) {
      setSelected(null);
    }
  };
  const zoom = (factor: number) => {
    setSmooth(true);
    setTimeout(() => setSmooth(false), 700);
    setView((v) => {
      const k = Math.min(3, Math.max(0.5, v.k * factor));
      const cx = W / 2;
      const cy = H / 2;
      return { k, x: cx - ((cx - v.x) / v.k) * k, y: cy - ((cy - v.y) / v.k) * k };
    });
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 40) return;
      e.preventDefault();
      zoom(e.deltaY < 0 ? 1.1 : 0.9);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  // --------------------------------------------------------------- derived
  const bySlug = useMemo(() => new Map(simNodes.map((n) => [n.slug, n])), [simNodes]);
  const linkEnd = (v: SimLink["source"]) => (typeof v === "object" ? (v as SimNode) : bySlug.get(v as string));

  const focusSet = useMemo(() => {
    if (selected) {
      const s = new Set([selected]);
      for (const l of simLinks) {
        const a = linkEnd(l.source)?.slug;
        const b = linkEnd(l.target)?.slug;
        if (a === selected && b) s.add(b);
        if (b === selected && a) s.add(a);
      }
      return s;
    }
    if (focusU) return new Set(simNodes.filter((n) => n.universe === focusU).map((n) => n.slug));
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, focusU, simLinks, simNodes]);

  const hulls = universes
    .filter((u) => u.id !== "independents")
    .map((u) => {
      const ms = simNodes.filter((n) => n.universe === u.id && n.x !== undefined);
      if (!ms.length) return null;
      const cx = ms.reduce((s, n) => s + n.x!, 0) / ms.length;
      const cy = ms.reduce((s, n) => s + n.y!, 0) / ms.length;
      const r = Math.max(...ms.map((n) => Math.hypot(n.x! - cx, n.y! - cy) + n.r)) + 26;
      return { u, cx, cy, r };
    })
    .filter(Boolean) as { u: GraphUniverse; cx: number; cy: number; r: number }[];

  const sel = selected ? bySlug.get(selected) : null;
  const selLinks = sel
    ? simLinks
        .filter((l) => linkEnd(l.source)?.slug === sel.slug || linkEnd(l.target)?.slug === sel.slug)
        .map((l) => ({
          other: linkEnd(l.source)?.slug === sel.slug ? linkEnd(l.target)! : linkEnd(l.source)!,
          type: l.type,
          note: l.note,
          out: linkEnd(l.source)?.slug === sel.slug,
        }))
    : [];

  let hoverCard: React.ReactNode = null;
  const hv = hover && hover !== selected ? bySlug.get(hover) : null;
  if (hv && hv.x !== undefined && svgRef.current && boxRef.current) {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = hv.x * view.k + view.x;
    pt.y = (hv.y! - hv.r) * view.k + view.y;
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const sp = pt.matrixTransform(ctm);
      const box = boxRef.current.getBoundingClientRect();
      const left = Math.min(Math.max(sp.x - box.left, 140), box.width - 140);
      const top = sp.y - box.top;
      hoverCard = (
        <div
          className="pointer-events-none absolute z-20 hidden w-[260px] -translate-x-1/2 -translate-y-full rounded-3xl bg-paper p-3 shadow-lift md:block"
          style={{ left, top: Math.max(top - 10, 250) }}
        >
          <div className="flex items-center gap-3">
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl" style={avatarBg(hv.slug)}>
              {portraitOf(hv.slug).avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/avatars/${hv.slug}/avatar-160.webp`} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <CharacterArt art={portraitOf(hv.slug).art} name={hv.name} className="absolute inset-0 h-full w-full" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-base font-extrabold uppercase leading-tight">{hv.name}</div>
              <div className="font-mono text-[10.5px] text-muted">{hv.rank ? `#${hv.rank} in the index` : "Watchlist"}</div>
              <div className="mt-1">
                <StatusChip code={hv.status} />
              </div>
            </div>
            <FameDisc value={hv.fame} size={48} accent={portraitOf(hv.slug).accent} />
          </div>
          <div className="mt-2.5">
            <HeatBar value={hv.momentum} heat={hv.heat} />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="relative">
      {/* universe filter */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        <button
          onClick={() => {
            setFocusU(null);
            setSelected(null);
          }}
          className={`shrink-0 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] ${
            !focusU ? "bg-ink text-white" : "bg-card shadow-card"
          }`}
        >
          All universes
        </button>
        {universes.map((u) => (
          <button
            key={u.id}
            onClick={() => {
              setFocusU(focusU === u.id ? null : u.id);
              setSelected(null);
            }}
            className={`shrink-0 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] ${
              focusU === u.id ? "bg-ink text-white" : "bg-card shadow-card hover:bg-white"
            }`}
          >
            ✺ {u.name} <span className="opacity-50">{u.members.length}</span>
          </button>
        ))}
      </div>

      <div ref={boxRef} className="relative overflow-hidden rounded-5xl bg-card shadow-card">
        <div className="grain pointer-events-none absolute inset-0 opacity-50" />
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio={narrow ? "xMidYMid slice" : "xMidYMid meet"}
          className={`relative block ${height} min-h-[520px] w-full touch-none select-none`}
          onPointerDown={onBgDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          role="img"
          aria-label="Interactive network of AI characters"
        >
          <defs>
            {simNodes.map((n) => (
              <clipPath key={n.slug} id={`clip-${n.slug}`}>
                <circle r={n.r} />
              </clipPath>
            ))}
            {simNodes.map((n) => {
              const bg = avatarBg(n.slug).background.match(/rgb\([^)]*\)/g) ?? [];
              return (
                <radialGradient key={`g-${n.slug}`} id={`bg-${n.slug}`} cx="50%" cy="36%" r="70%">
                  <stop offset="0%" stopColor={bg[0]} />
                  <stop offset="100%" stopColor={bg[1]} />
                </radialGradient>
              );
            })}
          </defs>
          <g
            style={{
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
              transformOrigin: "0 0",
              transition: smooth ? "transform 0.6s cubic-bezier(0.16,1,0.3,1)" : undefined,
            }}
          >
            {hulls.map(({ u, cx, cy, r }) => {
              const dim = focusU ? focusU !== u.id : !!selected;
              return (
                <g
                  key={u.id}
                  opacity={dim ? 0.25 : 1}
                  className="cursor-pointer transition-opacity"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    setFocusU(focusU === u.id ? null : u.id);
                    setSelected(null);
                  }}
                >
                  <circle cx={cx} cy={cy} r={r} fill="#141414" fillOpacity={focusU === u.id ? 0.06 : 0.03} stroke="#141414" strokeOpacity={0.12} strokeDasharray="4 6" />
                  <text x={cx} y={cy - r - 10} textAnchor="middle" className="font-mono" fontSize={14} letterSpacing={2} fill="#141414" fillOpacity={0.55}>
                    {u.name.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {simLinks.map((l, i) => {
              const a = linkEnd(l.source);
              const b = linkEnd(l.target);
              if (!a || !b || a.x === undefined || b.x === undefined || !types[l.type]) return null;
              const on = !focusSet || (focusSet.has(a.slug) && focusSet.has(b.slug));
              const mx = (a.x + b.x!) / 2;
              const my = (a.y! + b.y!) / 2;
              const dx = b.x! - a.x;
              const dy = b.y! - a.y!;
              const bend = l.type === "RIVAL" ? 0.18 : 0.08;
              const qx = mx - dy * bend;
              const qy = my + dx * bend;
              return (
                <path
                  key={i}
                  d={`M${a.x},${a.y} Q${qx},${qy} ${b.x},${b.y}`}
                  fill="none"
                  stroke={EDGE_COLOR[l.type]}
                  strokeOpacity={on ? (l.type === "SAME_UNIVERSE" ? 0.35 : 0.75) : 0.06}
                  strokeWidth={l.type === "SAME_UNIVERSE" ? 1.5 : Math.min(7, 1.5 + Math.log2(l.count + 1) * 1.3)}
                  strokeDasharray={l.type === "SAME_UNIVERSE" ? "4 6" : l.type === "MENTION" ? "1 0" : undefined}
                  className="transition-[stroke-opacity] duration-300"
                />
              );
            })}

            {simNodes.map((n) => {
              if (n.x === undefined) return null;
              const spec = portraitOf(n.slug);
              const on = !focusSet || focusSet.has(n.slug);
              const isSel = selected === n.slug;
              const showLabel = n.fame >= 55 || hover === n.slug || isSel || (focusSet?.has(n.slug) ?? false);
              const pulse = Math.max(0.9, 3.4 - n.momentum / 30);
              const s = (n.r * 2.6) / 400;
              return (
                <g
                  key={n.slug}
                  transform={`translate(${n.x},${n.y})`}
                  opacity={on ? 1 : 0.12}
                  className="cursor-pointer transition-opacity duration-300"
                  onPointerDown={(e) => onNodeDown(e, n.slug)}
                  onPointerEnter={() => setHover(n.slug)}
                  onPointerLeave={() => setHover((h) => (h === n.slug ? null : h))}
                >
                  {n.momentum >= 45 && (
                    <circle
                      r={n.r}
                      fill={HEAT_STYLE[n.heat].color}
                      className="animate-pulseRing"
                      style={{ transformBox: "fill-box", transformOrigin: "center", animationDuration: `${pulse}s` }}
                    />
                  )}
                  <circle r={n.r + 4} fill="#fff" />
                  <circle r={n.r} fill={`url(#bg-${n.slug})`} />
                  <g clipPath={`url(#clip-${n.slug})`}>
                    {spec.avatar ? (
                      <image
                        href={`/avatars/${n.slug}/avatar-${n.r > 34 ? 512 : 160}.webp`}
                        x={-n.r}
                        y={-n.r}
                        width={n.r * 2}
                        height={n.r * 2}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    ) : (
                      <svg x={-200 * s} y={-212 * s} width={400 * s} height={480 * s} overflow="visible">
                        <CharacterArt art={spec.art} name={n.name} className="h-full w-full" />
                      </svg>
                    )}
                  </g>
                  <circle r={n.r + 4} fill="none" stroke={isSel ? "#141414" : "transparent"} strokeWidth={4} />
                  {n.rank && n.rank <= 10 && (
                    <g transform={`translate(${n.r * 0.72},${-n.r * 0.72}) scale(${1 / view.k})`}>
                      <circle r={13} fill="#141414" />
                      <text textAnchor="middle" y={4.5} fontSize={12} fill="#fff" className="font-display" fontWeight={800}>
                        {n.rank}
                      </text>
                    </g>
                  )}
                  {showLabel && (
                    <g transform={`translate(0,${n.r + 22 / view.k}) scale(${1 / view.k})`} pointerEvents="none">
                      <rect x={-n.name.length * 4.6 - 10} y={-14} width={n.name.length * 9.2 + 20} height={22} rx={11} fill="#141414" />
                      <text textAnchor="middle" y={2} fontSize={13} fill="#fff" className="font-display" fontWeight={800} letterSpacing={0.4}>
                        {n.name.toUpperCase()}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* zoom */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1.5">
          {[
            ["+", () => zoom(1.2)],
            ["−", () => zoom(1 / 1.2)],
            ["⟲", () => setView(homeView(narrow))],
          ].map(([l, f]) => (
            <button
              key={l as string}
              onClick={f as () => void}
              className="grid h-10 w-10 place-items-center rounded-full bg-paper font-mono text-lg shadow-card hover:bg-white"
              aria-label={l === "+" ? "Zoom in" : l === "−" ? "Zoom out" : "Reset view"}
            >
              {l as string}
            </button>
          ))}
        </div>

        {/* hover mini-profile */}
        {hoverCard}

        {/* legend */}
        <div className="absolute bottom-4 right-4 hidden max-w-[220px] rounded-3xl bg-paper/90 p-4 text-xs shadow-card backdrop-blur md:block">
          <p className="kicker mb-2">Lines</p>
          <ul className="flex flex-col gap-1.5">
            {(Object.keys(EDGE_LABEL) as EdgeType[]).map((t) => (
              <li key={t}>
                <button onClick={() => setTypes((x) => ({ ...x, [t]: !x[t] }))} className={`flex items-center gap-2 ${types[t] ? "" : "opacity-35"}`}>
                  <span
                    className="inline-block h-[3px] w-6 rounded-full"
                    style={{
                      background: t === "SAME_UNIVERSE" ? `repeating-linear-gradient(90deg, ${EDGE_COLOR[t]} 0 4px, transparent 4px 8px)` : EDGE_COLOR[t],
                    }}
                  />
                  <span className="font-mono uppercase tracking-[0.1em]">{EDGE_LABEL[t]}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="kicker mb-1 mt-3">Nodes</p>
          <p className="leading-snug text-ink/70">Size = Fame. Pulse = Momentum. Drag to move, click to focus.</p>
        </div>

        <AnimatePresence>
          {sel && (
            <motion.aside
              key={sel.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-x-3 bottom-3 max-h-[60%] overflow-y-auto rounded-4xl bg-paper p-4 shadow-lift sm:inset-x-auto sm:right-4 sm:w-[340px]"
            >
              <div className="flex items-center gap-3">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl" style={avatarBg(sel.slug)}>
                  {portraitOf(sel.slug).avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/avatars/${sel.slug}/avatar-160.webp`} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <CharacterArt art={portraitOf(sel.slug).art} name={sel.name} className="absolute inset-0 h-full w-full" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-xl font-extrabold uppercase leading-tight">{sel.name}</div>
                  <div className="truncate font-mono text-xs text-muted">@{sel.handle}</div>
                  <div className="mt-1 font-mono text-[11px]">
                    {sel.rank ? `#${sel.rank}` : "Watchlist"} · F {sel.fame.toFixed(1)} · M {sel.momentum.toFixed(1)}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="self-start rounded-full px-2 text-lg" aria-label="Close">
                  ×
                </button>
              </div>
              {selLinks.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {selLinks.map((l, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="chip mt-0.5 text-white" style={{ background: EDGE_COLOR[l.type] }}>
                        {EDGE_LABEL[l.type]}
                      </span>
                      <button className="text-left font-semibold hover:underline" onClick={() => setSelected(l.other.slug)}>
                        {l.out ? "→" : "←"} {l.other.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">No observed links to other AI characters yet.</p>
              )}
              {sel.inclusion === "INCLUDED" && (
                <Link href={`/c/${sel.slug}/`} className="mt-4 block rounded-full bg-ink py-2.5 text-center font-mono text-xs uppercase tracking-[0.14em] text-white">
                  Open profile →
                </Link>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {focusU && (
        <p className="mt-4 text-center text-sm text-muted">
          {universes.find((u) => u.id === focusU)?.tagline}
        </p>
      )}
    </div>
  );
}
