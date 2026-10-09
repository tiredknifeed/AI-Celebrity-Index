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

/** Directory listing of data/submissions (name + blob sha), short-lived. */
async function listing(): Promise<{ name: string; sha: string }[]> {
  const res = await fetch(api(`contents/data/submissions?ref=${encodeURIComponent(await branch())}`), {
    headers: headers(),
    next: { revalidate: config.liveRevalidate, tags: [LIVE_TAG] },
  });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`listing HTTP ${res.status}`);
  return ((await res.json()) as { name: string; sha: string; type: string }[]).filter((f) => f.type === "file" && f.name.endsWith(".json"));
}

/** A file by blob sha: immutable, cached for good. */
async function blob<T>(sha: string): Promise<T> {
  const res = await fetch(api(`git/blobs/${sha}`), { headers: headers(), cache: "force-cache" });
  if (!res.ok) throw new Error(`blob HTTP ${res.status}`);
  const b = (await res.json()) as { content: string };
  return JSON.parse(Buffer.from(b.content, "base64").toString("utf8")) as T;
}

/** Avatars normalized after the deploy (scripts/avatars/avatars.json entries marked auto). */
async function avatarConfig(): Promise<Record<string, { accent?: string; auto?: boolean }>> {
  const res = await fetch(api(`contents/scripts/avatars/avatars.json?ref=${encodeURIComponent(await branch())}`), {
    headers: { ...headers(), accept: "application/vnd.github.raw+json" },
    next: { revalidate: config.liveRevalidate, tags: [LIVE_TAG] },
  });
  if (!res.ok) return {};
  return (await res.json()) as Record<string, { accent?: string; auto?: boolean }>;
}

export function assetUrl(path: string) {
  return `/api/live-asset/?path=${encodeURIComponent(path)}`;
}

function portraitsFor(ds: Dataset, records: SubmissionRecord[], avatars: Record<string, { accent?: string; auto?: boolean }>) {
  const built = builtPortraits as Record<string, PortraitSpec>;
  const byHandle = new Map(records.map((r) => [r.handle, r]));
  const out: Record<string, PortraitSpec> = {};
  for (const c of ds.characters) {
    // deployed and hand-made avatars are served locally
    if (built[c.slug] || ownPortraits[c.slug]?.avatar || c.inclusion !== "INCLUDED") continue;
    const cfg = avatars[c.slug];
    if (cfg?.auto) {
      out[c.slug] = { accent: cfg.accent ?? "#CFC8BA", avatar: true, source: "instagram", base: assetUrl(`public/avatars/${c.slug}/`) };
      continue;
    }
    const pic = byHandle.get(c.handle)?.avatar?.path;
    if (pic) out[c.slug] = { accent: "#CFC8BA", avatar: true, source: "instagram", pending: assetUrl(pic) };
  }
  return out;
}

let memo: { key: string; data: Data; portraits: Record<string, PortraitSpec> } | null = null;
let warned = false;

async function load(): Promise<{ data: Data; portraits: Record<string, PortraitSpec> }> {
  if (!config.githubToken || process.env.LIVE_DATA === "off") return { data: STATIC_DATA, portraits: {} };
  try {
    const [files, avatars] = await Promise.all([listing(), avatarConfig()]);
    const key = JSON.stringify([files.map((f) => f.sha), Object.keys(avatars).filter((k) => avatars[k].auto)]);
    if (memo?.key === key) return memo;
    const records = await Promise.all(files.map((f) => blob<SubmissionRecord>(f.sha)));
    const ds = mergeSubmissions(raw as unknown as Dataset, records);
    memo = { key, data: makeData(ds), portraits: portraitsFor(ds, records, avatars) };
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
