import { after, NextResponse } from "next/server";
import { missingConfig } from "@/lib/submissions/config";
import { branchFor, findPR, readSubmission } from "@/lib/submissions/github";
import { processSubmission } from "@/lib/submissions/process";
import { getCheckout } from "@/lib/submissions/stripe";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Status of a submission. Free: ?id=&handle= (GitHub PR state only).
 * Paid: ?session_id= (Stripe paid? + PR state); if the webhook was missed, a
 * paid session without a PR is processed here.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  if (missingConfig().length) return NextResponse.json({ state: "unconfigured" }, { status: 503 });
  // Free submissions: the PR is opened before the submitter reaches this page.
  const freeId = q.get("id");
  const freeHandle = q.get("handle")?.toLowerCase();
  if (freeId && freeHandle) {
    if (!/^[a-z0-9._]{1,30}$/.test(freeHandle) || !/^[a-z0-9_]{6,40}$/i.test(freeId))
      return NextResponse.json({ error: "Invalid link" }, { status: 400 });
    try {
      const branch = branchFor(freeHandle, freeId);
      const pr = await findPR(branch);
      if (!pr) return NextResponse.json({ state: "error", handle: freeHandle, error: "Submission not found." }, { status: 404 });
      return NextResponse.json({ state: pr.state, handle: freeHandle, report: toReport(await readSubmission(branch, freeHandle)) });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 502 });
    }
  }
  const id = q.get("session_id");
  if (!id) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  try {
    const s = await getCheckout(id);
    if (!s.paid || !s.handle) return NextResponse.json({ state: "unpaid", handle: s.handle });
    const pr = await findPR(branchFor(s.handle, s.id));
    if (!pr) {
      after(async () => {
        try {
          await processSubmission(s.id);
        } catch (e) {
          console.error(`submission ${s.id} failed:`, e);
        }
      });
      return NextResponse.json({ state: "analysing", handle: s.handle });
    }
    return NextResponse.json({ state: pr.state, handle: s.handle, report: toReport(await readSubmission(branchFor(s.handle, s.id), s.handle)) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

type Stored = {
  profile?: { followers?: number; verified?: boolean };
  metrics?: { maxLikes?: number | null; avgLikes12?: number | null; postsAnalysed?: number; lastPost?: string | null };
  scores?: { fame?: number; momentum?: number };
  token?: { verification?: string; ticker?: string | null };
  links?: { handle: string }[];
};

function toReport(raw: Record<string, unknown> | null) {
  if (!raw) return null;
  const record = raw as Stored;
  return {
    followers: record.profile?.followers ?? null,
    verified: record.profile?.verified ?? false,
    fame: record.scores?.fame ?? null,
    momentum: record.scores?.momentum ?? null,
    maxLikes: record.metrics?.maxLikes ?? null,
    avgLikes12: record.metrics?.avgLikes12 ?? null,
    postsAnalysed: record.metrics?.postsAnalysed ?? null,
    lastPost: record.metrics?.lastPost ?? null,
    token: record.token?.verification ?? "NONE",
    ticker: record.token?.ticker ?? null,
    links: (record.links ?? []).map((l) => l.handle),
  };
}
