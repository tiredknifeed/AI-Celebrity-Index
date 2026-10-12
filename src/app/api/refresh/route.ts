import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getData, getSnapshots, LIVE_TAG } from "@/lib/live";
import { buildSnapshot, type Snapshot } from "@/lib/refresh/snapshot";
import { analyze } from "@/lib/submissions/analyze";
import { config, missingConfig } from "@/lib/submissions/config";
import { commitFile } from "@/lib/submissions/github";
import { fetchProfile } from "@/lib/submissions/instagram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 30 posts cover every window the scores use (12 recent, 14 and 30 days at the caps)
const POSTS = 30;
const SOURCE = `apify:${config.apifyProfileActor}+${config.apifyPostsActor}`;
const today = () => new Date().toISOString().slice(0, 10);
// captured by this instance today, in case GitHub's tree lags behind a commit
const done = new Map<string, string>();

async function queue() {
  const [data, snaps] = await Promise.all([getData(), getSnapshots()]);
  const last = new Map(snaps.map((s) => [s.handle, s]));
  const day = today();
  const researched = data.characters.filter((c) => c.group !== "SUBMITTED");
  const attempted = (h: string) => done.get(h) === day || last.get(h)?.attempt?.date === day;
  const todo = researched
    .filter((c) => !attempted(c.handle))
    .sort((a, b) => (last.get(a.handle)?.attempt?.date ?? "").localeCompare(last.get(b.handle)?.attempt?.date ?? "") || (a.ranks?.index ?? 999) - (b.ranks?.index ?? 999));
  return { data, last, researched, todo, day };
}

const authorized = (req: Request) => !process.env.REFRESH_KEY || req.headers.get("x-refresh-key") === process.env.REFRESH_KEY;

/** How many researched characters still need today's capture. */
export async function GET() {
  const { researched, todo, day } = await queue();
  return NextResponse.json({ day, total: researched.length, remaining: todo.length });
}

/**
 * Captures fresh Instagram numbers for the next researched character that has
 * not been captured today and commits data/snapshots/<handle>.json ([skip
 * netlify]); the site shows them within seconds, no rebuild. One profile per
 * call (a capture takes a while); call it until "done". Each character is
 * captured at most once a day, so repeated calls cannot run up the Apify bill.
 * Set REFRESH_KEY on the host to require the x-refresh-key header.
 */
export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const missing = missingConfig().filter((k) => k !== "STRIPE_SECRET_KEY" && k !== "STRIPE_WEBHOOK_SECRET");
  if (missing.length) return NextResponse.json({ error: "Not configured", missing }, { status: 503 });
  const { last, todo, day } = await queue();
  const c = todo[0];
  if (!c) return NextResponse.json({ done: true, day, remaining: 0 });
  done.set(c.handle, day);
  const prev = last.get(c.handle);
  let snap: Snapshot;
  try {
    const raw = await fetchProfile(c.handle, POSTS);
    if (raw.private) throw new Error("profile is private");
    if (!raw.followers || !raw.posts.length) throw new Error("no profile data returned");
    const rec = analyze(raw, { id: "refresh", payment: null, knownHandles: [], source: SOURCE });
    snap = buildSnapshot(c, rec, SOURCE);
  } catch (e) {
    // keep the last good capture; only note the failed attempt so the queue moves on
    snap = { ...(prev ?? { schema: 1, handle: c.handle }), attempt: { date: day, ok: false, error: (e as Error).message.slice(0, 200) } } as Snapshot;
  }
  await commitFile(
    `data/snapshots/${c.handle}.json`,
    Buffer.from(JSON.stringify(snap, null, 2) + "\n").toString("base64"),
    snap.attempt.ok ? `Refresh @${c.handle}` : `Refresh @${c.handle} failed`,
  );
  revalidateTag(LIVE_TAG);
  revalidatePath("/", "layout");
  return NextResponse.json({
    handle: c.handle,
    ok: snap.attempt.ok,
    ...(snap.attempt.ok ? { followers: snap.patch?.followers, fame: snap.scores?.fame, momentum: snap.scores?.momentum } : { error: snap.attempt.error }),
    remaining: todo.length - 1,
  });
}
