// The submission pipeline: (payment ->) Instagram data -> analysis -> PR.

import { randomBytes } from "node:crypto";
import { characters } from "../data";
import { analyze, type SubmissionRecord } from "./analyze";
import { config } from "./config";
import { branchFor, findPR, openSubmissionPR } from "./github";
import { fetchProfile } from "./instagram";
import { getCheckout } from "./stripe";

function fmt(n: number | null | undefined) {
  return n === null || n === undefined ? "—" : Math.round(n).toLocaleString("en-US");
}

function summary(r: SubmissionRecord): string {
  const m = r.metrics;
  return [
    r.payment
      ? `Paid submission for [@${r.handle}](${r.profileUrl}) · Stripe \`${r.payment.session}\``
      : `Free submission for [@${r.handle}](${r.profileUrl}) · \`${r.submissionId}\``,
    "",
    "| | |",
    "|---|---|",
    `| Followers | ${fmt(r.profile.followers)} |`,
    `| Posts analysed | ${m.postsAnalysed} of ${fmt(r.profile.postsCount)} |`,
    `| First / last post | ${m.firstPost ?? "—"} / ${m.lastPost ?? "—"} |`,
    `| Avg likes (12) / 14d | ${fmt(m.avgLikes12)} / ${fmt(m.avgLikes14d)} |`,
    `| Peak post | ${fmt(m.maxLikes)} likes |`,
    `| Provisional Fame / Momentum | **${r.scores.fame}** / **${r.scores.momentum}** |`,
    `| Token | ${r.token.verification}${r.token.ticker ? ` ${r.token.ticker}` : ""}${r.token.contract ? ` \`${r.token.contract}\`` : ""} |`,
    `| Links to indexed characters | ${r.links.map((l) => `@${l.handle} (${l.count})`).join(", ") || "none"} |`,
    "",
    "### Review before merging",
    "",
    "- [ ] It is a fictional / AI character (not a real person, copycat or compilation page)",
    "- [ ] Fill `review`: `name`, `characterType`, `universe`, `parodyOf` (if it references a real person or IP)",
    "- [ ] Rate `recognizability` and the four `distinct` inputs (0-5)",
    "- [ ] Set `review.include` to `true`",
    "",
    r.payment
      ? "Merging adds the character on the next deploy. Closing the PR rejects it (refund through Stripe if needed)."
      : "Merging adds the character on the next deploy. Closing the PR rejects it.",
  ].join("\n");
}

async function run(handle: string, id: string, payment: SubmissionRecord["payment"]) {
  const existing = await findPR(branchFor(handle, id));
  if (existing) return existing.url;
  const raw = await fetchProfile(handle);
  if (raw.private) throw new SubmissionError("This profile is private. Only public profiles can be analyzed.");
  const record = analyze(raw, {
    id,
    payment: payment ? { session: payment.session, amount: payment.amount, currency: payment.currency } : null,
    knownHandles: characters.map((c) => c.handle),
    source: `apify:${config.apifyProfileActor}+${config.apifyPostsActor}`,
  });
  // The CDN link expires, so the picture itself is committed with the submission.
  const pic = raw.profilePicUrl ? await downloadImage(raw.profilePicUrl) : null;
  const extra = [];
  if (pic) {
    const path = `data/avatars/source/${handle}.${pic.ext}`;
    record.avatar = { path, origin: "Instagram profile picture", capturedAt: record.capturedAt };
    extra.push({ path, base64: pic.base64, message: `Add profile picture for @${handle}` });
  }
  return openSubmissionPR(handle, id, record, summary(record), extra);
}

async function downloadImage(url: string): Promise<{ base64: string; ext: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000 || buf.length > 8_000_000) return null;
    return { base64: buf.toString("base64"), ext: type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg" };
  } catch {
    return null;
  }
}

/** An error whose message is safe to show to the submitter. */
export class SubmissionError extends Error {}

/** Paid mode: runs after Stripe confirms the payment. */
export async function processSubmission(sessionId: string): Promise<string> {
  const s = await getCheckout(sessionId);
  if (!s.paid || !s.handle) throw new Error("Session is not paid");
  return run(s.handle, s.id, { provider: "stripe", session: s.id, amount: s.amount, currency: s.currency });
}

/** Free mode: runs right away. Returns the id the status page polls with. */
export async function processFreeSubmission(handle: string): Promise<{ id: string; prUrl: string }> {
  const id = `free_${randomBytes(6).toString("hex")}`;
  const prUrl = await run(handle, id, null);
  return { id, prUrl };
}
