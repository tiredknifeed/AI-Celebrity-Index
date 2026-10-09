import { NextResponse } from "next/server";
import { byHandle } from "@/lib/data";
import { config, missingConfig } from "@/lib/submissions/config";
import { parseInstagram } from "@/lib/submissions/handle";
import { createCheckout } from "@/lib/submissions/stripe";

export const dynamic = "force-dynamic";

/** Starts a paid submission: validates the link and returns a Stripe Checkout URL. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { url?: string; email?: string };
  const handle = parseInstagram(body.url ?? "");
  if (!handle) return NextResponse.json({ error: "That does not look like an Instagram profile link." }, { status: 400 });
  const known = byHandle(handle);
  if (known && known.inclusion === "INCLUDED")
    return NextResponse.json({ error: "Already in the index.", slug: known.slug }, { status: 409 });
  const missing = missingConfig();
  if (missing.length) return NextResponse.json({ error: "Submissions are not open yet.", missing }, { status: 503 });
  const email = typeof body.email === "string" && /.+@.+\..+/.test(body.email) ? body.email : null;
  try {
    const checkout = await createCheckout(handle, email);
    return NextResponse.json({ handle, checkoutUrl: checkout.url, price: config.priceCents, currency: config.currency });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
