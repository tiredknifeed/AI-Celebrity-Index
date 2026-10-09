// The paid-submission pipeline: payment -> Instagram data -> analysis -> PR.

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
    `Paid submission for [@${r.handle}](${r.profileUrl}) · Stripe \`${r.payment.session}\``,
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
    "Merging adds the character on the next deploy. Closing the PR rejects it (refund through Stripe if needed).",
  ].join("\n");
}

export async function processSubmission(sessionId: string): Promise<string> {
  const s = await getCheckout(sessionId);
  if (!s.paid || !s.handle) throw new Error("Session is not paid");
  const existing = await findPR(branchFor(s.handle, s.id));
  if (existing) return existing.url;
  const raw = await fetchProfile(s.handle);
  if (raw.private) throw new Error("Profile is private");
  const record = analyze(raw, {
    session: s.id,
    amount: s.amount,
    currency: s.currency,
    knownHandles: characters.map((c) => c.handle),
    source: `apify:${config.apifyProfileActor}+${config.apifyPostsActor}`,
  });
  return openSubmissionPR(s.handle, s.id, record, summary(record));
}
