import type { Metadata } from "next";
import NetworkGraph from "@/components/NetworkGraph";
import UniverseGrid from "@/components/UniverseGrid";
import { characters, edges, universes } from "@/lib/data";

export const metadata: Metadata = { title: "The Universe" };

export default function NetworkPage() {
  const linked = new Set(edges.flatMap((e) => [e.source, e.target]));
  const nodes = characters
    .filter((c) => c.inclusion === "INCLUDED" || linked.has(c.handle))
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      handle: c.handle,
      fame: c.scores.fame,
      momentum: c.scores.momentum,
      heat: c.heat,
      universe: c.universe,
      rank: c.ranks?.index ?? null,
      inclusion: c.inclusion,
      followers: c.followers,
      status: c.status.code,
    }));
  const slugOf = new Map(characters.map((c) => [c.handle, c.slug]));
  const graphEdges = edges
    .filter((e) => slugOf.has(e.source) && slugOf.has(e.target))
    .map((e) => ({ source: slugOf.get(e.source)!, target: slugOf.get(e.target)!, type: e.type, count: e.count, note: e.note }));
  const counts = graphEdges.reduce<Record<string, number>>((m, e) => ((m[e.type] = (m[e.type] ?? 0) + 1), m), {});

  return (
    <>
      <header className="wrap flex flex-col justify-between gap-4 pb-4 pt-28 md:flex-row md:items-end">
        <div>
          <p className="kicker mb-2">Social graph · {nodes.length} characters</p>
          <h1 className="display text-6xl sm:text-8xl">The Universe</h1>
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-xs md:justify-end">
          {Object.entries(counts).map(([t, n]) => (
            <span key={t} className="chip bg-card shadow-card">
              {n} {t.replace("_", " ").toLowerCase()}
            </span>
          ))}
        </div>
      </header>
      <section className="px-2 sm:px-4">
        <NetworkGraph nodes={nodes} edges={graphEdges} universes={universes.map(({ id, name, tagline, members }) => ({ id, name, tagline, members }))} />
        <p className="wrap mt-4 text-sm text-muted">
          Size is Fame, the pulse is Momentum. Hover a portrait for a mini profile, click to focus on its connections. Rival,
          storyline and collab labels are an analyst reading of observed tags (INFERRED); dashed grey lines mean “same universe, no
          direct tag seen yet”. Real people and brands tagged as props are listed on profiles, never drawn as collaborations.
        </p>
      </section>
      <section className="wrap mt-20">
        <h2 className="display mb-8 text-6xl">Universes</h2>
        <UniverseGrid universes={universes} />
      </section>
    </>
  );
}
