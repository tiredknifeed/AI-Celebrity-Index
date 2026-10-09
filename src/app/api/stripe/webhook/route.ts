import { after, NextResponse } from "next/server";
import { processSubmission } from "@/lib/submissions/process";
import { verifyWebhook } from "@/lib/submissions/stripe";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Stripe calls this after payment; analysis runs after the response is sent. */
export async function POST(req: Request) {
  const payload = await req.text();
  if (!verifyWebhook(payload, req.headers.get("stripe-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  const event = JSON.parse(payload) as { type: string; data: { object: { id: string; payment_status?: string } } };
  if (event.type === "checkout.session.completed" && event.data.object.payment_status === "paid") {
    const id = event.data.object.id;
    after(async () => {
      try {
        await processSubmission(id);
      } catch (e) {
        console.error(`submission ${id} failed:`, e);
      }
    });
  }
  return NextResponse.json({ received: true });
}
