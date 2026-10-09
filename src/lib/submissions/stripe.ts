// Minimal Stripe Checkout over the REST API (no SDK) plus webhook verification.

import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./config";

async function stripe(path: string, init: { method?: string; form?: Record<string, string> } = {}) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: init.method ?? (init.form ? "POST" : "GET"),
    headers: {
      authorization: `Bearer ${config.stripeSecret}`,
      ...(init.form ? { "content-type": "application/x-www-form-urlencoded" } : {}),
    },
    body: init.form ? new URLSearchParams(init.form).toString() : undefined,
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) throw new Error(`Stripe: ${(json.error as { message?: string })?.message ?? res.status}`);
  return json;
}

export async function createCheckout(handle: string, email: string | null): Promise<{ id: string; url: string }> {
  const form: Record<string, string> = {
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": config.currency,
    "line_items[0][price_data][unit_amount]": String(config.priceCents),
    "line_items[0][price_data][product_data][name]": `AI Fame Index analysis: @${handle}`,
    "line_items[0][price_data][product_data][description]":
      "Full profile analysis (Fame, Momentum, career timeline, network links, token check) and analyst review for inclusion in the index.",
    "metadata[handle]": handle,
    "payment_intent_data[metadata][handle]": handle,
    success_url: `${config.siteUrl}/submit/status/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.siteUrl}/submit/?handle=${encodeURIComponent(handle)}&cancelled=1`,
  };
  if (email) form.customer_email = email;
  const s = await stripe("checkout/sessions", { form });
  return { id: s.id as string, url: s.url as string };
}

export interface CheckoutSession {
  id: string;
  paid: boolean;
  handle: string | null;
  amount: number;
  currency: string;
}

export async function getCheckout(id: string): Promise<CheckoutSession> {
  const s = await stripe(`checkout/sessions/${encodeURIComponent(id)}`);
  return {
    id: s.id as string,
    paid: s.payment_status === "paid",
    handle: ((s.metadata as Record<string, string> | null)?.handle as string) ?? null,
    amount: (s.amount_total as number) ?? config.priceCents,
    currency: (s.currency as string) ?? config.currency,
  };
}

/** Verifies the Stripe-Signature header (v1 scheme, 5-minute tolerance). */
export function verifyWebhook(payload: string, header: string | null): boolean {
  if (!header || !config.stripeWebhookSecret) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const ts = Number(parts.t);
  if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const expected = createHmac("sha256", config.stripeWebhookSecret).update(`${ts}.${payload}`).digest("hex");
  const sigs = header
    .split(",")
    .filter((kv) => kv.startsWith("v1="))
    .map((kv) => kv.slice(3));
  return sigs.some((sig) => sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected)));
}
