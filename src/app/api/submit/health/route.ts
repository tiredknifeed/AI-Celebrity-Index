import { NextResponse } from "next/server";
import { config, missingConfig } from "@/lib/submissions/config";

export const dynamic = "force-dynamic";

type Check = { ok: boolean; detail: string };

async function github(): Promise<Check> {
  if (!config.githubToken) return { ok: false, detail: "GITHUB_TOKEN is not set" };
  try {
    const res = await fetch(`${config.githubApi}/repos/${config.githubRepo}`, {
      headers: { authorization: `Bearer ${config.githubToken}`, accept: "application/vnd.github+json" },
      cache: "no-store",
    });
    if (res.status === 401) return { ok: false, detail: "GitHub rejected the token (401): wrong, expired or revoked" };
    if (res.status === 404) return { ok: false, detail: `The token cannot see ${config.githubRepo} (404): add this repository to the token` };
    if (!res.ok) return { ok: false, detail: `GitHub HTTP ${res.status}` };
    const repo = (await res.json()) as { default_branch?: string; permissions?: { push?: boolean } };
    if (repo.permissions && !repo.permissions.push) return { ok: false, detail: "The token's account cannot push to the repository" };
    return { ok: true, detail: `repo ${config.githubRepo}, base branch ${config.githubBase || repo.default_branch}` };
  } catch (e) {
    return { ok: false, detail: `GitHub unreachable: ${(e as Error).message}` };
  }
}

async function apify(): Promise<Check> {
  if (!config.apifyToken) return { ok: false, detail: "APIFY_TOKEN is not set" };
  const q = `token=${encodeURIComponent(config.apifyToken)}`;
  try {
    const me = await fetch(`${config.apifyApi}/v2/users/me?${q}`, { cache: "no-store" });
    if (me.status === 401) return { ok: false, detail: "Apify rejected the token (401)" };
    if (!me.ok) return { ok: false, detail: `Apify HTTP ${me.status}` };
    for (const actor of [config.apifyProfileActor, config.apifyPostsActor]) {
      const a = await fetch(`${config.apifyApi}/v2/acts/${actor}?${q}`, { cache: "no-store" });
      if (!a.ok) return { ok: false, detail: `Apify actor ${actor} not available (HTTP ${a.status})` };
    }
    return { ok: true, detail: "token valid, both actors available" };
  } catch (e) {
    return { ok: false, detail: `Apify unreachable: ${(e as Error).message}` };
  }
}

/** Setup self-check for the site owner. Reports only yes/no and reasons, never key values. */
export async function GET() {
  const [gh, ap] = await Promise.all([github(), apify()]);
  const missing = missingConfig();
  return NextResponse.json({
    ready: missing.length === 0 && gh.ok && ap.ok,
    build: process.env.BUILD_COMMIT ? process.env.BUILD_COMMIT.slice(0, 7) : null,
    mode: config.free ? "free" : "paid",
    missing,
    github: gh,
    apify: ap,
  });
}
