import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getData, getSnapshots, LIVE_TAG } from "@/lib/live";
import { buildSnapshot, type Snapshot } from "@/lib/refresh/snapshot";
import { analyze } from "@/lib/submissions/analyze";
import { config, missingConfig } from "@/lib/submissions/config";
import { commitFile } from "@/lib/submissions/github";
import { runItems, runStatus, startProfileRuns, toProfile } from "@/lib/submissions/instagram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 30 posts cover every window the scores use (12 recent, 14 and 30 days at the caps)
const POSTS = 30;
const SOURCE = `apify:${config.apifyProfileActor}+${config.apifyPostsActor}`;
const today = () => new Date().toISOString().slice(0, 10);
const FINISHED_BAD = new Set(["FAILED", "TIMED-OUT", "ABORTED"]);
// started by this instance today, in case GitHub's tree lags behind a commit
const started = new Map<string, string>();

async function state() {
  const [data, snaps] = await Promise.all([getData(), getSnapshots()]);
  const last = new Map(snaps.map((s) => [s.handle, s]));
  const day = today();
  const researched = data.characters.filter((c) => c.group !== "SUBMITTED");
  const pending = snaps.find((s) => s.pending?.date === day) ?? null;
  const attempted = (h: string) => last.get(h)?.attempt?.date === day || (started.get(h) === day && pending?.handle !== h);
  const todo = researched
    .filter((c) => !attempted(c.handle) && c.handle !== pending?.handle)
    .sort((a, b) => (last.get(a.handle)?.attempt?.date ?? "").localeCompare(last.get(b.handle)?.attempt?.date ?? "") || (a.ranks?.index ?? 999) - (b.ranks?.index ?? 999));
  return { data, last, researched, todo, pending, day };
}

const authorized = (req: Request) => !process.env.REFRESH_KEY || req.headers.get("x-refresh-key") === process.env.REFRESH_KEY;

async function save(snap: Snapshot, message: string) {
  await commitFile(`data/snapshots/${snap.handle}.json`, Buffer.from(JSON.stringify(snap, null, 2) + "\n").toString("base64"), message);
  revalidateTag(LIVE_TAG);
  revalidatePath("/", "layout");
}

/** How many researched characters still need today's capture. */
export async function GET() {
  const { researched, todo, pending, day } = await state();
  return NextResponse.json({ day, total: researched.length, remaining: todo.length + (pending ? 1 : 0), pending: pending?.handle ?? null });
}

/**
 * Brings the researched characters' Instagram numbers up to date, one step per
 * call so no request outlives the host's time limit: a call either starts the
 * Apify runs for the next character (recorded in data/snapshots/<handle>.json
 * as "pending") or collects the pending runs once they finish and commits the
 * fresh snapshot ([skip netlify]); the site shows it within seconds, no rebuild.
 * Call it until "done". Each character is captured at most once a day, so
 * repeated calls cannot run up the Apify bill. Set REFRESH_KEY on the host to
 * require the x-refresh-key header.
 */
export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const missing = missingConfig().filter((k) => k !== "STRIPE_SECRET_KEY" && k !== "STRIPE_WEBHOOK_SECRET");
  if (missing.length) return NextResponse.json({ error: "Not configured", missing }, { status: 503 });
  const { data, todo, pending, day } = await state();

  if (pending?.pending) {
    const runs = pending.pending;
    const prev: Snapshot = { ...pending };
    delete prev.pending;
    const fail = async (error: string) => {
      await save({ ...prev, attempt: { date: day, ok: false, error: error.slice(0, 200) } }, `Refresh @${pending.handle} failed`);
      return NextResponse.json({ handle: pending.handle, ok: false, error, remaining: todo.length });
    };
    try {
      const [ps, qs] = await Promise.all([runStatus(runs.profile), runStatus(runs.posts)]);
      if (FINISHED_BAD.has(ps) || FINISHED_BAD.has(qs)) return await fail(`Apify runs ended ${ps} / ${qs}`);
      if (ps !== "SUCCEEDED" || qs !== "SUCCEEDED") return NextResponse.json({ handle: pending.handle, waiting: true, status: [ps, qs], remaining: todo.length + 1 });
      const [profiles, posts] = await Promise.all([runItems(runs.profile), runItems(runs.posts)]);
      const raw = toProfile(pending.handle, profiles, posts);
      if (raw.private) return await fail("profile is private");
      if (!raw.followers || !raw.posts.length) return await fail("no profile data returned");
      const c = data.characters.find((x) => x.handle === pending.handle);
      if (!c) return await fail("character no longer in the index");
      const rec = analyze(raw, { id: "refresh", payment: null, knownHandles: [], source: SOURCE });
      const snap = buildSnapshot(c, rec, SOURCE);
      await save(snap, `Refresh @${c.handle}`);
      return NextResponse.json({ handle: c.handle, ok: true, followers: snap.patch?.followers, fame: snap.scores?.fame, momentum: snap.scores?.momentum, remaining: todo.length });
    } catch (e) {
      return await fail((e as Error).message);
    }
  }

  const c = todo[0];
  if (!c) return NextResponse.json({ done: true, day, remaining: 0 });
  started.set(c.handle, day);
  try {
    const runs = await startProfileRuns(c.handle, POSTS);
    // keep the last good capture while the runs work
    const prev = (await getSnapshots()).find((s) => s.handle === c.handle);
    await save({ ...(prev ?? { schema: 1, handle: c.handle }), pending: { date: day, ...runs } }, `Refresh @${c.handle} started`);
    return NextResponse.json({ handle: c.handle, started: true, remaining: todo.length });
  } catch (e) {
    const prev = (await getSnapshots()).find((s) => s.handle === c.handle);
    await save({ ...(prev ?? { schema: 1, handle: c.handle }), attempt: { date: day, ok: false, error: (e as Error).message.slice(0, 200) } }, `Refresh @${c.handle} failed`);
    return NextResponse.json({ handle: c.handle, ok: false, error: (e as Error).message, remaining: todo.length - 1 });
  }
}
