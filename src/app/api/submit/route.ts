import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getData, LIVE_TAG } from "@/lib/live";
import { config, missingConfig } from "@/lib/submissions/config";
import { SUBMISSIONS_OPEN } from "@/lib/submissions/open";
import { readLiveSubmission } from "@/lib/submissions/github";
import { parseInstagram } from "@/lib/submissions/handle";
import { slugify } from "@/lib/submissions/merge";
import { publishFreeSubmission, SubmissionError } from "@/lib/submissions/process";
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
 * Starts a submission. Free mode (default): analyzes the profile, publishes it
 * on GitHub and refreshes the site's data at once; returns the new profile's
 * slug. Paid mode: returns a Stripe Checkout URL; the webhook does the rest.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { url?: string; email?: string; website?: string };
  if (!SUBMISSIONS_OPEN) return NextResponse.json({ error: "Adding characters is coming soon." }, { status: 403 });
  // honeypot: real visitors never see or fill this field
  if (body.website) return NextResponse.json({ error: "Rejected." }, { status: 400 });
  const handle = parseInstagram(body.url ?? "");
  if (!handle) return NextResponse.json({ error: "That does not look like an Instagram profile link." }, { status: 400 });
  const missing = missingConfig();
  if (missing.length) return NextResponse.json({ error: "Submissions are not open yet.", missing }, { status: 503 });
  const data = await getData();
  const known = data.byHandle(handle);
  if (known && known.inclusion === "INCLUDED")
    return NextResponse.json({ error: "Already in the index.", slug: known.slug }, { status: 409 });

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
    // an editor set include:false on this account: it stays off the site
    const prior = (await readLiveSubmission(handle)) as { review?: { include?: boolean } } | null;
    if (prior && prior.review?.include === false)
      return NextResponse.json({ error: "This account was reviewed and removed from the index by the editors." }, { status: 409 });
    const userAdded = data.characters.filter((c) => c.group === "SUBMITTED").length;
    if (userAdded >= config.maxLive)
      return NextResponse.json({ error: "The index is not accepting new characters right now. Please try again later." }, { status: 429 });
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
    if (limited(ip)) return NextResponse.json({ error: "Too many submissions from your network. Try again in an hour." }, { status: 429 });

    const record = await publishFreeSubmission(handle, data.characters.map((c) => c.handle));
    // the next request reads the new file instead of the cached listing
    revalidateTag(LIVE_TAG);
    revalidatePath("/", "layout");
    const base = slugify(record.review.name || handle);
    const taken = data.bySlug(base);
    const slug = taken && taken.handle !== handle ? `${base}-${slugify(handle)}` : base;
    return NextResponse.json({ handle, slug, published: true });
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
