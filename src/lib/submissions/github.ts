// The review queue is a GitHub pull request per submission: the worker
// commits data/submissions/<handle>.json on its own branch and opens a PR.
// An analyst fills in the review block and merges; the next deploy adds the
// character to the index. Closing the PR rejects it.

import { config } from "./config";

async function gh(path: string, init: { method?: string; body?: unknown } = {}): Promise<unknown> {
  const res = await fetch(`${config.githubApi}/repos/${config.githubRepo}/${path}`, {
    method: init.method ?? "GET",
    headers: {
      authorization: `Bearer ${config.githubToken}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 404) return null;
  const json = await res.json();
  if (!res.ok) throw new Error(`GitHub ${path}: ${(json as { message?: string }).message ?? res.status}`);
  return json;
}

export function branchFor(handle: string, session: string) {
  return `submission/${handle.replace(/[^a-z0-9._-]/g, "-")}-${session.slice(-8).toLowerCase()}`;
}

export async function openSubmissionPR(handle: string, session: string, record: unknown, summary: string): Promise<string> {
  const branch = branchFor(handle, session);
  const existing = await findPR(branch);
  if (existing) return existing.url;
  const base = (await gh(`git/ref/heads/${config.githubBase}`)) as { object: { sha: string } } | null;
  if (!base) throw new Error(`Base branch ${config.githubBase} not found`);
  await gh("git/refs", { method: "POST", body: { ref: `refs/heads/${branch}`, sha: base.object.sha } });
  const path = `data/submissions/${handle}.json`;
  const current = (await gh(`contents/${path}?ref=${branch}`)) as { sha?: string } | null;
  await gh(`contents/${path}`, {
    method: "PUT",
    body: {
      message: `Add submission for @${handle}`,
      content: Buffer.from(JSON.stringify(record, null, 2) + "\n").toString("base64"),
      branch,
      ...(current?.sha ? { sha: current.sha } : {}),
    },
  });
  const pr = (await gh("pulls", {
    method: "POST",
    body: { title: `Submission: @${handle}`, head: branch, base: config.githubBase, body: summary },
  })) as { html_url: string };
  return pr.html_url;
}

export type ReviewState = "none" | "in_review" | "added" | "rejected";

export async function findPR(branch: string): Promise<{ url: string; state: ReviewState } | null> {
  const owner = config.githubRepo.split("/")[0];
  const list = (await gh(`pulls?state=all&head=${encodeURIComponent(`${owner}:${branch}`)}`)) as
    | { html_url: string; state: string; merged_at: string | null }[]
    | null;
  const pr = list?.[0];
  if (!pr) return null;
  return { url: pr.html_url, state: pr.merged_at ? "added" : pr.state === "open" ? "in_review" : "rejected" };
}

/** Reads the submission record committed on the PR branch. */
export async function readSubmission(branch: string, handle: string): Promise<Record<string, unknown> | null> {
  const file = (await gh(`contents/data/submissions/${handle}.json?ref=${encodeURIComponent(branch)}`)) as { content?: string } | null;
  if (!file?.content) return null;
  try {
    return JSON.parse(Buffer.from(file.content, "base64").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Open submission PRs (the review queue), for de-duplication and the free-mode queue cap. */
export async function openSubmissions(): Promise<{ handle: string; branch: string; url: string }[]> {
  const out: { handle: string; branch: string; url: string }[] = [];
  for (let page = 1; page <= 3; page++) {
    const list = (await gh(`pulls?state=open&per_page=100&page=${page}`)) as
      | { html_url: string; title: string; head: { ref: string } }[]
      | null;
    if (!list?.length) break;
    for (const pr of list) {
      const m = pr.title.match(/^Submission: @([a-z0-9._]+)$/i);
      if (m && pr.head.ref.startsWith("submission/")) out.push({ handle: m[1].toLowerCase(), branch: pr.head.ref, url: pr.html_url });
    }
    if (list.length < 100) break;
  }
  return out;
}

/** The submission id encoded in a branch name (its last 8 characters of the id). */
export function idSuffix(branch: string) {
  return branch.slice(branch.lastIndexOf("-") + 1);
}
