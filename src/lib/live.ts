// Request-time data: the build-time dataset plus every user submission that is
// on GitHub right now. Server pages call getData() instead of importing the
// static views, so a new submission shows up within seconds, without a rebuild.
//
// Reads are cached by Next (tag LIVE_TAG, LIVE_REVALIDATE_SECONDS); the submit
// route clears the tag right after committing, so the next request is fresh.
// Without GITHUB_TOKEN the site simply serves the build-time data.

import { cache } from "react";
import raw from "@/data/generated/index.json";
import builtPortraits from "@/data/generated/portraits.json";
import { portraits as ownPortraits, setLivePortraits, type PortraitSpec } from "@/data/portraits";
import { makeData, STATIC_DATA, type Data } from "./data";
import type { SubmissionRecord } from "./submissions/analyze";
import { config } from "./submissions/config";
import { mergeSubmissions } from "./submissions/merge";
import type { Dataset } from "./types";

export const LIVE_TAG = "live-submissions";

const headers = () => ({
  authorization: `Bearer ${config.githubToken}`,
  accept: "application/vnd.github+json",
  "x-github-api-version": "2022-11-28",
});
const api = (path: string) => `${config.githubApi}/repos/${config.githubRepo}/${path}`;

let branchName: string | null = null;
async function branch(): Promise<string> {
  if (config.githubBase) return config.githubBase;
  if (branchName) return branchName;
  const res = await fetch(api("").replace(/\/$/, ""), { headers: headers(), cache: "force-cache" });
  const repo = (await res.json()) as { default_branch?: string };
  if (!repo.default_branch) throw new Error("repository not readable");
  return (branchName = repo.default_branch);
}

/** Every file on the default branch (path -> blob sha): one short-lived request. */
async function tree(): Promise<Map<string, string>> {
  const res = await fetch(api(`git/trees/${encodeURIComponent(await branch())}?recursive=1`), {
    headers: headers(),
    next: { revalidate: config.liveRevalidate, tags: [LIVE_TAG] },
  });
  if (!res.ok) throw new Error(`tree HTTP ${res.status}`);
  const t = (await res.json()) as { tree: { path: string; sha: string; type: string }[] };
  return new Map(t.tree.filter((e) => e.type === "blob").map((e) => [e.path, e.sha]));
}

/** A JSON file by blob sha: immutable, cached for good. */
async function blob<T>(sha: string): Promise<T> {
  const res = await fetch(api(`git/blobs/${sha}`), { headers: headers(), cache: "force-cache" });
  if (!res.ok) throw new Error(`blob HTTP ${res.status}`);
  const b = (await res.json()) as { content: string };
  return JSON.parse(Buffer.from(b.content, "base64").toString("utf8")) as T;
}

/**
 * URL of a repository file served by /api/live-asset. The path and the file's
 * blob sha are part of the URL (no query string), so CDN caches can keep each
 * version for good and never mix two files up.
 */
export function assetUrl(path: string, sha: string) {
  return `/api/live-asset/${sha.slice(0, 12)}/${path}`;
}

type AvatarCfg = Record<string, { accent?: string; auto?: boolean }>;

function portraitsFor(ds: Dataset, records: SubmissionRecord[], avatars: AvatarCfg, files: Map<string, string>) {
  const built = builtPortraits as Record<string, PortraitSpec>;
  const byHandle = new Map(records.map((r) => [r.handle, r]));
  const out: Record<string, PortraitSpec> = {};
  for (const c of ds.characters) {
    // deployed and hand-made avatars are served locally
    if (built[c.slug] || ownPortraits[c.slug]?.avatar || c.inclusion !== "INCLUDED") continue;
    const cutout = files.get(`public/avatars/${c.slug}/cutout-1024.webp`);
    if (avatars[c.slug]?.auto && cutout) {
      // all sizes are regenerated together, so the cutout's sha versions the set
      out[c.slug] = { accent: avatars[c.slug].accent ?? "#CFC8BA", avatar: true, source: "instagram", base: assetUrl(`public/avatars/${c.slug}/`, cutout) };
      continue;
    }
    const pic = byHandle.get(c.handle)?.avatar?.path;
    const picSha = pic ? files.get(pic) : undefined;
    if (pic && picSha) out[c.slug] = { accent: "#CFC8BA", avatar: true, source: "instagram", pending: assetUrl(pic, picSha) };
  }
  return out;
}

let memo: { key: string; data: Data; portraits: Record<string, PortraitSpec> } | null = null;
let warned = false;

async function load(): Promise<{ data: Data; portraits: Record<string, PortraitSpec> }> {
  if (!config.githubToken || process.env.LIVE_DATA === "off") return { data: STATIC_DATA, portraits: {} };
  try {
    const files = await tree();
    const subs = [...files].filter(([p]) => /^data\/submissions\/[^/]+\.json$/.test(p));
    const avatarsSha = files.get("scripts/avatars/avatars.json");
    const avatarFiles = [...files].filter(([p]) => p.startsWith("public/avatars/") || p.startsWith("data/avatars/source/"));
    const key = JSON.stringify([subs, avatarsSha, avatarFiles]);
    if (memo?.key === key) return memo;
    const [records, avatars] = await Promise.all([
      Promise.all(subs.map(([, sha]) => blob<SubmissionRecord>(sha))),
      avatarsSha ? blob<AvatarCfg>(avatarsSha) : Promise.resolve({} as AvatarCfg),
    ]);
    const ds = mergeSubmissions(raw as unknown as Dataset, records);
    memo = { key, data: makeData(ds), portraits: portraitsFor(ds, records, avatars, files) };
    return memo;
  } catch (e) {
    if (!warned) console.error("live data unavailable, serving the build-time dataset:", (e as Error).message);
    warned = true;
    return { data: STATIC_DATA, portraits: {} };
  }
}

/** The dataset with live submissions merged in (once per request). */
export const getData = cache(async (): Promise<Data> => {
  const { data, portraits } = await load();
  setLivePortraits(portraits);
  return data;
});

/** Portrait specs of live user-added characters, for the client registry. */
export const getLivePortraits = cache(async () => (await load()).portraits);
