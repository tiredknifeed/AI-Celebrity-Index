import { after, NextResponse } from "next/server";
import { missingConfig } from "@/lib/submissions/config";
import { branchFor, findPR, readSubmission } from "@/lib/submissions/github";
import { processSubmission } from "@/lib/submissions/process";
import { getCheckout } from "@/lib/submissions/stripe";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Status of a submission, derived from Stripe (paid?) and GitHub (PR state).
 * If the webhook was missed, a paid session without a PR is processed here.
 */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("session_id");
  if (!id) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  if (missingConfig().length) return NextResponse.json({ state: "unconfigured" }, { status: 503 });
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
    const record = (await readSubmission(branchFor(s.handle, s.id), s.handle)) as {
      profile?: { followers?: number; verified?: boolean };
      metrics?: { maxLikes?: number | null; avgLikes12?: number | null; postsAnalysed?: number; lastPost?: string | null };
      scores?: { fame?: number; momentum?: number };
      token?: { verification?: string; ticker?: string | null };
      links?: { handle: string }[];
    } | null;
    return NextResponse.json({
      state: pr.state,
      handle: s.handle,
      report: record
        ? {
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
          }
        : null,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
