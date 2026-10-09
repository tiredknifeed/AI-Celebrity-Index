import type { Metadata } from "next";
import NetworkGraph from "@/components/NetworkGraph";
import PageHead from "@/components/PageHead";
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
    }));
  const slugOf = new Map(characters.map((c) => [c.handle, c.slug]));
  const graphEdges = edges
    .filter((e) => slugOf.has(e.source) && slugOf.has(e.target))
    .map((e) => ({ source: slugOf.get(e.source)!, target: slugOf.get(e.target)!, type: e.type, count: e.count, note: e.note }));
  const counts = graphEdges.reduce<Record<string, number>>((m, e) => ((m[e.type] = (m[e.type] ?? 0) + 1), m), {});

  return (
    <>
      <PageHead
        kicker="Social graph"
        title="The Universe"
        intro="Every portrait is a character. Size is Fame, the pulse is Momentum, and the lines are real tags, call-outs and storylines found in their posts. Pick a universe to isolate it."
      >
        <div className="mt-6 flex flex-wrap gap-2 font-mono text-xs">
          <span className="chip bg-ink text-white">{nodes.length} characters</span>
          {Object.entries(counts).map(([t, n]) => (
            <span key={t} className="chip bg-card shadow-card">
              {n} {t.replace("_", " ").toLowerCase()}
            </span>
          ))}
        </div>
      </PageHead>
      <section className="wrap">
        <NetworkGraph nodes={nodes} edges={graphEdges} universes={universes.map(({ id, name, tagline, members }) => ({ id, name, tagline, members }))} />
        <p className="mt-4 text-sm text-muted">
          Rival, storyline and collab labels are an analyst reading of the observed tags (INFERRED). Dashed grey lines mean
          “same universe, no direct tag seen yet”. Real people and brands that characters tag as props are listed on each
          profile, never drawn as collaborations.
        </p>
      </section>
      <section className="wrap mt-20">
        <h2 className="display mb-8 text-6xl">Universes</h2>
        <UniverseGrid universes={universes} />
      </section>
    </>
  );
}
