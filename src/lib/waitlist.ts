// Waitlist storage: one JSON document in a private Netlify Blobs store,
// updated with compare-and-swap (onlyIfMatch) so simultaneous sign-ups never
// overwrite each other. X handles never land in the public repository.
// Outside Netlify (local dev) an in-memory store stands in.

import { getStore } from "@netlify/blobs";
import { JOIN_POINTS, REFERRAL_POINTS, TASKS, type TaskId } from "@/data/waitlist";

interface User {
  /** handle as typed */
  h: string;
  /** joined at (ms) */
  j: number;
  /** completed tasks -> ms */
  t: Partial<Record<TaskId, number>>;
  /** referred by (key) */
  r: string | null;
  /** people this user referred */
  n: number;
}
interface Board {
  users: Record<string, User>;
}

const KEY = "board";
const memory: { board: Board; etag: number } = { board: { users: {} }, etag: 0 };

function store() {
  try {
    return getStore({ name: "waitlist", consistency: "strong" });
  } catch {
    return null; // no Netlify Blobs context (local dev)
  }
}

async function read(): Promise<{ board: Board; etag: string | null }> {
  const s = store();
  if (!s) return { board: structuredClone(memory.board), etag: String(memory.etag) };
  const got = await s.getWithMetadata(KEY, { type: "json" });
  return got ? { board: got.data as Board, etag: got.etag ?? null } : { board: { users: {} }, etag: null };
}

async function write(board: Board, etag: string | null): Promise<boolean> {
  const s = store();
  if (!s) {
    if (String(memory.etag) !== etag) return false;
    memory.board = board;
    memory.etag++;
    return true;
  }
  const res = etag ? await s.setJSON(KEY, board, { onlyIfMatch: etag }) : await s.setJSON(KEY, board, { onlyIfNew: true });
  return res.modified;
}

/** Read-modify-write with retries on concurrent updates. */
async function update(fn: (b: Board) => void): Promise<Board> {
  for (let i = 0; i < 8; i++) {
    const { board, etag } = await read();
    fn(board);
    if (await write(board, etag)) return board;
    await new Promise((r) => setTimeout(r, 50 + Math.random() * 150));
  }
  throw new Error("The waitlist is busy, try again");
}

const points = (u: User) =>
  JOIN_POINTS + TASKS.reduce((s, t) => s + (u.t[t.id] ? t.points : 0), 0) + u.n * REFERRAL_POINTS;

function ranking(b: Board) {
  return Object.entries(b.users).sort(([, a], [, c]) => points(c) - points(a) || a.j - c.j);
}

export interface WaitlistState {
  handle: string;
  points: number;
  position: number;
  total: number;
  tasks: Partial<Record<TaskId, boolean>>;
  referrals: number;
  top: { handle: string; points: number }[];
}

function stateOf(b: Board, key: string): WaitlistState | null {
  const u = b.users[key];
  const order = ranking(b);
  const top = order.slice(0, 10).map(([, x]) => ({ handle: x.h, points: points(x) }));
  if (!u) return null;
  return {
    handle: u.h,
    points: points(u),
    position: order.findIndex(([k]) => k === key) + 1,
    total: order.length,
    tasks: Object.fromEntries(TASKS.map((t) => [t.id, !!u.t[t.id]])),
    referrals: u.n,
    top,
  };
}

export async function leaderboard() {
  const { board } = await read();
  return { total: Object.keys(board.users).length, top: ranking(board).slice(0, 10).map(([, x]) => ({ handle: x.h, points: points(x) })) };
}

export async function getState(handle: string) {
  return stateOf((await read()).board, handle.toLowerCase());
}

export async function join(handle: string, ref: string | null): Promise<WaitlistState> {
  const key = handle.toLowerCase();
  const refKey = ref?.toLowerCase() ?? null;
  const board = await update((b) => {
    if (b.users[key]) return;
    const r = refKey && refKey !== key && b.users[refKey] ? refKey : null;
    b.users[key] = { h: handle, j: Date.now(), t: {}, r, n: 0 };
    if (r) b.users[r].n++;
  });
  return stateOf(board, key)!;
}

export async function completeTask(handle: string, task: TaskId): Promise<WaitlistState | null> {
  const key = handle.toLowerCase();
  const board = await update((b) => {
    const u = b.users[key];
    if (u && !u.t[task]) u.t[task] = Date.now();
  });
  return stateOf(board, key);
}
