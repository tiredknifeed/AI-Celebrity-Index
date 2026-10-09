import { NextResponse } from "next/server";
import { byHandle } from "@/lib/data";
import { config, missingConfig } from "@/lib/submissions/config";
import { idSuffix, openSubmissions } from "@/lib/submissions/github";
import { parseInstagram } from "@/lib/submissions/handle";
import { processFreeSubmission, SubmissionError } from "@/lib/submissions/process";
import { createCheckout } from "@/lib/submissions/stripe";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Free mode: best-effort per-IP limit (per server instance; resets on cold start).
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= config.perIpHourly) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

/**
 * Starts a submission. Free mode (default): analyzes the profile right away and
 * opens the review PR, then returns the status-page id. Paid mode: returns a
 * Stripe Checkout URL; the webhook does the rest.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { url?: string; email?: string; website?: string };
  // honeypot: real visitors never see or fill this field
  if (body.website) return NextResponse.json({ error: "Rejected." }, { status: 400 });
  const handle = parseInstagram(body.url ?? "");
  if (!handle) return NextResponse.json({ error: "That does not look like an Instagram profile link." }, { status: 400 });
  const known = byHandle(handle);
  if (known && known.inclusion === "INCLUDED")
    return NextResponse.json({ error: "Already in the index.", slug: known.slug }, { status: 409 });
  const missing = missingConfig();
  if (missing.length) return NextResponse.json({ error: "Submissions are not open yet.", missing }, { status: 503 });

  if (!config.free) {
    const email = typeof body.email === "string" && /.+@.+\..+/.test(body.email) ? body.email : null;
    try {
      const checkout = await createCheckout(handle, email);
      return NextResponse.json({ handle, checkoutUrl: checkout.url, price: config.priceCents, currency: config.currency });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 502 });
    }
  }

  try {
    // Someone already submitted it: point to the same review instead of a duplicate.
    const queue = await openSubmissions();
    const dup = queue.find((q) => q.handle === handle);
    if (dup) return NextResponse.json({ handle, id: idSuffix(dup.branch), duplicate: true });
    if (queue.length >= config.queueLimit)
      return NextResponse.json({ error: "The review queue is full right now. Please try again in a few days." }, { status: 429 });
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
    if (limited(ip)) return NextResponse.json({ error: "Too many submissions from your network. Try again in an hour." }, { status: 429 });
    const { id } = await processFreeSubmission(handle);
    return NextResponse.json({ handle, id });
  } catch (e) {
    if (e instanceof SubmissionError) return NextResponse.json({ error: e.message }, { status: 422 });
    console.error(`free submission @${handle} failed:`, e);
    const msg = (e as Error).message.replace(/token=[^&\s]+/g, "token=***");
    return NextResponse.json(
      {
        error: /not found|not public/i.test(msg) ? "We could not find a public Instagram profile with that handle." : "The analysis failed. Please try again later.",
        detail: msg.slice(0, 300),
      },
      { status: 502 },
    );
  }
}
