// Checks that the request-time merge (src/lib/submissions/merge.ts) produces
// the same dataset as scripts/build_data.py for the submissions in the repo.
//   npm run data && npx tsx scripts/check_merge.ts
import { readFileSync, readdirSync } from "node:fs";
import { mergeSubmissions } from "../src/lib/submissions/merge";
import type { SubmissionRecord } from "../src/lib/submissions/analyze";
import type { Dataset } from "../src/lib/types";

const built = JSON.parse(readFileSync("src/data/generated/index.json", "utf8")) as Dataset;
const records = readdirSync("data/submissions")
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(`data/submissions/${f}`, "utf8")) as SubmissionRecord);
const live = mergeSubmissions(built, records);

const pick = (d: Dataset) => ({
  characters: d.characters.map((c) => ({ ...c })).sort((a, b) => a.id - b.id),
  edges: [...d.edges].sort((a, b) => `${a.source}|${a.target}`.localeCompare(`${b.source}|${b.target}`)),
  universes: d.universes,
  included: d.meta.counts.included,
});
const a = pick(built);
const b = pick(live);
let diffs = 0;
const cmp = (path: string, x: unknown, y: unknown) => {
  if (typeof x === "number" && typeof y === "number" ? Math.abs(x - y) > 1e-9 : JSON.stringify(x) !== JSON.stringify(y)) {
    if (x && y && typeof x === "object" && typeof y === "object" && !Array.isArray(x)) {
      for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) cmp(`${path}.${k}`, (x as never)[k], (y as never)[k]);
      return;
    }
    if (Array.isArray(x) && Array.isArray(y) && x.length === y.length) {
      x.forEach((v, i) => cmp(`${path}[${i}]`, v, y[i]));
      return;
    }
    if (diffs++ < 20) console.log(`diff ${path}: python=${JSON.stringify(x)?.slice(0, 120)} ts=${JSON.stringify(y)?.slice(0, 120)}`);
  }
};
cmp("", a, b);
console.log(`${records.length} submission(s), ${b.characters.length} characters, ${b.edges.length} edges: ${diffs} difference(s)`);
process.exit(diffs ? 1 : 0);
