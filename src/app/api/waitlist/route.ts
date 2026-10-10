import { NextResponse } from "next/server";
import { parseXHandle, TASKS, type TaskId } from "@/data/waitlist";
import { completeTask, getState, join, leaderboard } from "@/lib/waitlist";

export const dynamic = "force-dynamic";

// best-effort per-IP limit on sign-ups (per server instance)
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= 10) return true;
  hits.set(ip, [...recent, now]);
  return false;
}

/** ?handle= -> that person's position; no handle -> total and top 10. */
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("handle");
  try {
    if (!raw) return NextResponse.json(await leaderboard());
    const handle = parseXHandle(raw);
    const state = handle ? await getState(handle) : null;
    return state ? NextResponse.json(state) : NextResponse.json({ error: "Not on the waitlist" }, { status: 404 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** { action: "join", handle, ref? } or { action: "task", handle, task }. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { action?: string; handle?: string; ref?: string; task?: string };
  const handle = parseXHandle(body.handle ?? "");
  if (!handle) return NextResponse.json({ error: "Enter your X handle, like @name." }, { status: 400 });
  try {
    if (body.action === "join") {
      const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
      if (!(await getState(handle)) && limited(ip)) return NextResponse.json({ error: "Too many sign-ups from your network. Try later." }, { status: 429 });
      return NextResponse.json(await join(handle, body.ref ? parseXHandle(body.ref) : null));
    }
    if (body.action === "task") {
      if (!TASKS.some((t) => t.id === body.task)) return NextResponse.json({ error: "Unknown task" }, { status: 400 });
      const state = await completeTask(handle, body.task as TaskId);
      return state ? NextResponse.json(state) : NextResponse.json({ error: "Join the waitlist first" }, { status: 404 });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
