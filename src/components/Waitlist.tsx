"use client";

import { useEffect, useRef, useState } from "react";
import { JOIN_POINTS, parseXHandle, REFERRAL_POINTS, REWARDS, TASK_WAIT, TASKS, type TaskId } from "@/data/waitlist";

interface State {
  handle: string;
  points: number;
  position: number;
  total: number;
  tasks: Partial<Record<TaskId, boolean>>;
  referrals: number;
  top: { handle: string; points: number }[];
}

const save = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {}
};
const load = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};

async function call(body: object): Promise<State> {
  const res = await fetch("/api/waitlist/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => ({}))) as State & { error?: string };
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json;
}

/** Join with an X handle, then climb the list with quick tasks and invites. */
export default function Waitlist({ initialTotal, initialTop }: { initialTotal: number; initialTop: { handle: string; points: number }[] }) {
  const [input, setInput] = useState("");
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState<Partial<Record<TaskId, number>>>({});
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => {
    setOrigin(window.location.origin);
    const ref = parseXHandle(new URLSearchParams(window.location.search).get("ref") ?? "");
    if (ref && !load("wl_ref")) save("wl_ref", ref);
    const mine = load("wl_handle");
    if (mine)
      fetch(`/api/waitlist/?handle=${encodeURIComponent(mine)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((s: State | null) => (s ? setState(s) : save("wl_handle", null)))
        .catch(() => {});
    const pending = timers.current;
    return () => pending.forEach((t) => (clearInterval(t), clearTimeout(t)));
  }, []);

  async function joinList(e: React.FormEvent) {
    e.preventDefault();
    const handle = parseXHandle(input);
    if (!handle) return setError("Enter your X handle, like @name.");
    setBusy(true);
    setError(null);
    try {
      const s = await call({ action: "join", handle, ref: load("wl_ref") ?? undefined });
      save("wl_handle", s.handle);
      setState(s);
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  const refLink = state ? `${origin}/?ref=${encodeURIComponent(state.handle)}#waitlist` : "";

  function start(id: TaskId, url: string) {
    if (!state || checking[id] !== undefined || state.tasks[id]) return;
    window.open(url, "_blank", "noopener,noreferrer");
    const handle = state.handle;
    setChecking((c) => ({ ...c, [id]: TASK_WAIT }));
    // countdown for the label…
    const tick = setInterval(() => setChecking((c) => (c[id] ? { ...c, [id]: c[id]! - 1 } : c)), 1000);
    timers.current.push(tick);
    // …and the task counts once the link has been open for TASK_WAIT seconds
    const done = setTimeout(() => {
      clearInterval(tick);
      call({ action: "task", handle, task: id })
        .then(setState)
        .catch((err) => setError((err as Error).message))
        .finally(() =>
          setChecking((c) => {
            const next = { ...c };
            delete next[id];
            return next;
          }),
        );
    }, TASK_WAIT * 1000);
    timers.current.push(done as unknown as ReturnType<typeof setInterval>);
  }

  const total = state?.total ?? initialTotal;
  const top = state?.top ?? initialTop;

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="panel p-5 sm:p-8 lg:col-span-7">
        {!state ? (
          <form onSubmit={joinList}>
            <p className="kicker">Your X handle</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 font-mono text-lg text-muted">@</span>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="yourname"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-full bg-paper py-4 pl-11 pr-5 font-mono text-lg outline-none ring-ink/20 focus:ring-2"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-ink px-7 py-4 font-mono text-[13px] uppercase tracking-[0.14em] text-white transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-50"
              >
                {busy ? "Joining…" : "Join the waitlist"}
              </button>
            </div>
            <p className="mt-3 text-xs text-ink/60">
              No password, no email. Your handle shows on the leaderboard if you reach the top 10. +{JOIN_POINTS} points for joining.
            </p>
            {error && <p className="mt-3 text-sm text-[#c0262c]">{error}</p>}
            <p className="kicker mt-8">Then climb the list</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {TASKS.filter((t) => t.url("")).map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-3xl bg-paper p-3 pl-4 opacity-70">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white font-mono text-xs">+{t.points}</span>
                  <span className="text-sm font-semibold leading-snug">{t.label}</span>
                </li>
              ))}
              <li className="flex items-center gap-3 rounded-3xl bg-paper p-3 pl-4 opacity-70">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white font-mono text-xs">+{REFERRAL_POINTS}</span>
                <span className="text-sm font-semibold leading-snug">Every friend who joins with your link</span>
              </li>
            </ul>
          </form>
        ) : (
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="kicker">You are in, @{state.handle}</p>
                <p className="display mt-1 text-6xl leading-none sm:text-7xl">#{state.position}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-[0.12em] text-muted">of {state.total} on the list</p>
              </div>
              <div className="rounded-3xl bg-ink px-5 py-3 text-white">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#C6F432]">Points</p>
                <p className="display text-4xl leading-none">{state.points}</p>
              </div>
            </div>

            <p className="kicker mt-8">Climb the list</p>
            <ul className="mt-3 space-y-2.5">
              {TASKS.map((t) => {
                const url = t.url(refLink);
                if (!url) return null;
                const done = !!state.tasks[t.id];
                const left = checking[t.id];
                return (
                  <li key={t.id} className={`flex items-center gap-3 rounded-3xl p-3 pl-4 ${done ? "bg-[#E7F6EC]" : "bg-paper"}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-xs ${done ? "bg-[#18A957] text-white" : "bg-white text-ink"}`}>
                      {done ? "✓" : `+${t.points}`}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">{t.label}</span>
                    {done ? (
                      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#0d7a3e]">Done</span>
                    ) : left !== undefined ? (
                      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Checking… {left > 0 ? left : ""}</span>
                    ) : (
                      <button
                        onClick={() => start(t.id, url)}
                        className="shrink-0 rounded-full bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white"
                      >
                        Go ↗
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            <p className="kicker mt-8">Invite friends · +{REFERRAL_POINTS} each</p>
            <div className="mt-3 flex items-center gap-2 rounded-full bg-paper p-1.5 pl-4">
              <span className="min-w-0 flex-1 truncate font-mono text-sm">{refLink}</span>
              <button
                onClick={() => navigator.clipboard?.writeText(refLink).then(() => (setCopied(true), setTimeout(() => setCopied(false), 1500)))}
                className="shrink-0 rounded-full bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-ink/60">
              {state.referrals > 0 ? `${state.referrals} friend${state.referrals === 1 ? "" : "s"} joined with your link.` : "Friends who join with your link move you up."}{" "}
              <button
                onClick={() => {
                  save("wl_handle", null);
                  setState(null);
                }}
                className="underline"
              >
                Not you?
              </button>
            </p>
            {error && <p className="mt-3 text-sm text-[#c0262c]">{error}</p>}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 lg:col-span-5">
        <div className="rounded-5xl bg-ink p-6 text-white sm:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#C6F432]">What you get</p>
          <ul className="mt-4 space-y-4">
            {REWARDS.map((r) => (
              <li key={r.rank} className="flex gap-3">
                <span className="mt-0.5 h-fit shrink-0 rounded-full bg-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#C6F432]">{r.rank}</span>
                <span>
                  <span className="block font-display text-lg font-extrabold leading-tight">{r.title}</span>
                  <span className="block text-sm text-white/70">{r.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        {top.length > 0 && (
          <div className="panel p-5 sm:p-6">
            <p className="kicker">Leaderboard · {total} on the list</p>
            <ol className="mt-3 space-y-1.5">
              {top.map((u, i) => (
                <li key={u.handle} className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${state?.handle === u.handle ? "bg-[#FFF4C7]" : ""}`}>
                  <span className="w-6 font-mono text-xs text-muted">{i + 1}</span>
                  <span className="flex-1 truncate font-mono text-sm">@{u.handle}</span>
                  <span className="font-display text-base font-extrabold">{u.points}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
