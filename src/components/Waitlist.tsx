"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AIRDROP_NOTE, JOIN_POINTS, parseXHandle, REFERRAL_POINTS, REWARDS, TASK_WAIT, TASKS, type TaskId } from "@/data/waitlist";

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

// ---- icons --------------------------------------------------------------------
const XLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
    <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
  </svg>
);
const Heart = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
    <path d="M12 21s-7.5-4.6-10-9.3C.4 8.5 2.3 4.5 6.1 4.5c2.2 0 3.6 1.2 5.9 3.6 2.3-2.4 3.7-3.6 5.9-3.6 3.8 0 5.7 4 4.1 7.2C19.5 16.4 12 21 12 21Z" />
  </svg>
);
const Repost = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 9V7a3 3 0 0 1 3-3h11l-3-3M20 15v2a3 3 0 0 1-3 3H6l3 3" />
  </svg>
);
const Pen = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />
  </svg>
);
const People = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.6.8 2.6 2.6 3 5.2" />
  </svg>
);
const ICON: Record<TaskId, () => ReactNode> = { follow: XLogo, like: Heart, repost: Repost, post: Pen };

/** Countdown ring shown while a task is "being checked". */
function Ring({ left }: { left: number }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const done = (TASK_WAIT - left) / TASK_WAIT;
  return (
    <span className="relative grid h-10 w-10 shrink-0 place-items-center">
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#141414" strokeOpacity={0.1} strokeWidth={3} />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="#141414"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - done)}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <span className="font-mono text-xs font-semibold">{Math.max(left, 0)}</span>
    </span>
  );
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
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

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

  const refLink = state ? `${origin}/waitlist/?ref=${encodeURIComponent(state.handle)}` : "";

  function start(id: TaskId, url: string) {
    if (!state || checking[id] !== undefined || state.tasks[id]) return;
    window.open(url, "_blank", "noopener,noreferrer");
    const handle = state.handle;
    setChecking((c) => ({ ...c, [id]: TASK_WAIT }));
    const tick = setInterval(() => setChecking((c) => (c[id] ? { ...c, [id]: c[id]! - 1 } : c)), 1000);
    // the task counts once the link has been open for TASK_WAIT seconds
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
    timers.current.push(tick, done);
  }

  const total = state?.total ?? initialTotal;
  const top = state?.top ?? initialTop;
  const doneCount = state ? TASKS.filter((t) => state.tasks[t.id]).length : 0;
  const maxPoints = JOIN_POINTS + TASKS.reduce((s, t) => s + t.points, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="lg:col-span-7">
        {!state ? (
          <div className="overflow-hidden rounded-5xl bg-ink text-white shadow-card">
            <form onSubmit={joinList} className="p-6 sm:p-9">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#C6F432]">Claim your spot · +{JOIN_POINTS} points</p>
              <p className="display mt-3 text-4xl leading-[0.95] sm:text-5xl">Your X handle</p>
              <div className="mt-6 flex flex-col gap-2 rounded-[2rem] bg-white p-2 sm:flex-row sm:rounded-full">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink">
                    <XLogo />
                  </span>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="@yourname"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Your X handle"
                    className="w-full rounded-full bg-transparent py-3.5 pl-12 pr-4 font-mono text-lg text-ink outline-none placeholder:text-ink/35"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-full bg-[#C6F432] px-7 py-3.5 font-mono text-[13px] font-semibold uppercase tracking-[0.14em] text-ink transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {busy ? "Joining…" : "Join"}
                </button>
              </div>
              {error && <p className="mt-3 text-sm text-[#FF9A9A]">{error}</p>}
              <p className="mt-3 text-xs text-white/50">No email, no password. Top-10 handles appear on the leaderboard.</p>
            </form>
            <div className="border-t border-white/10 bg-white/[0.04] p-6 sm:px-9">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/50">
                Then earn up to {maxPoints} points, plus {REFERRAL_POINTS} per friend
              </p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {TASKS.map((t) => {
                  const Icon = ICON[t.id];
                  return (
                    <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10">
                        <Icon />
                      </span>
                      <span className="flex-1 text-sm font-semibold leading-tight">{t.label}</span>
                      <span className="font-mono text-xs text-[#C6F432]">+{t.points}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-5xl bg-card shadow-card">
            {/* the pass */}
            <div className="bg-ink p-6 text-white sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#C6F432]">@{state.handle} · your spot</p>
                  <p className="display mt-2 text-7xl leading-none sm:text-8xl">#{state.position}</p>
                  <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-white/50">of {state.total} on the list</p>
                </div>
                <div className="text-right">
                  <p className="display text-6xl leading-none text-[#C6F432]">{state.points}</p>
                  <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-white/50">airdrop points</p>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-white/60">
                  <span>Tasks</span>
                  <span>
                    {doneCount} / {TASKS.length}
                  </span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#C6F432] transition-[width] duration-700" style={{ width: `${(doneCount / TASKS.length) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* tasks */}
            <ul className="space-y-3 p-4 sm:p-6">
              {TASKS.map((t) => {
                const Icon = ICON[t.id];
                const done = !!state.tasks[t.id];
                const left = checking[t.id];
                return (
                  <li
                    key={t.id}
                    className={`flex items-center gap-4 rounded-3xl border p-3.5 pr-4 transition-colors sm:p-4 ${
                      done ? "border-[#18A957]/30 bg-[#EFF9F1]" : "border-ink/10 bg-white hover:border-ink/25"
                    }`}
                  >
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${done ? "bg-[#18A957] text-white" : "bg-ink text-white"}`}>
                      {done ? "✓" : <Icon />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[17px] font-extrabold leading-tight">{t.label}</span>
                      <span className="mt-0.5 block text-xs text-ink/55">{left !== undefined ? "Checking your action…" : done ? "Done, points added" : t.hint}</span>
                    </span>
                    {done ? (
                      <span className="rounded-full bg-[#18A957] px-3 py-1.5 font-mono text-xs font-semibold text-white">+{t.points}</span>
                    ) : left !== undefined ? (
                      <Ring left={left} />
                    ) : (
                      <button
                        onClick={() => start(t.id, t.url(refLink))}
                        className="flex shrink-0 items-center gap-2 rounded-full bg-ink py-2 pl-4 pr-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white transition-transform hover:-translate-y-0.5"
                      >
                        Start
                        <span className="rounded-full bg-[#C6F432] px-2 py-0.5 text-[11px] font-semibold text-ink">+{t.points}</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* invites */}
            <div className="border-t border-line p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#C6F432] text-ink">
                  <People />
                </span>
                <span className="flex-1">
                  <span className="block font-display text-[17px] font-extrabold leading-tight">Invite friends · +{REFERRAL_POINTS} each</span>
                  <span className="block text-xs text-ink/55">
                    {state.referrals > 0 ? `${state.referrals} joined with your link so far` : "Points land when they join with your link"}
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-full bg-paper p-1.5 pl-4">
                <span className="min-w-0 flex-1 truncate font-mono text-sm">{refLink}</span>
                <button
                  onClick={() => navigator.clipboard?.writeText(refLink).then(() => (setCopied(true), setTimeout(() => setCopied(false), 1500)))}
                  className="shrink-0 rounded-full bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
              {error && <p className="mt-3 text-sm text-[#c0262c]">{error}</p>}
              <button
                onClick={() => {
                  save("wl_handle", null);
                  setState(null);
                }}
                className="mt-3 text-xs text-ink/50 underline"
              >
                Not @{state.handle}? Switch handle
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 lg:col-span-5">
        <div className="rounded-5xl bg-card p-6 shadow-card sm:p-8">
          <p className="kicker">What you get</p>
          <ul className="mt-4 space-y-3">
            {REWARDS.map((r) => (
              <li key={r.title} className={`rounded-3xl p-4 ${r.highlight ? "bg-ink text-white" : "bg-paper"}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className={`font-display text-lg font-extrabold leading-tight ${r.highlight ? "text-[#C6F432]" : ""}`}>{r.title}</span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${
                      r.highlight ? "bg-[#C6F432] text-ink" : "bg-white text-ink/70"
                    }`}
                  >
                    {r.rank}
                  </span>
                </div>
                <p className={`mt-1 text-sm ${r.highlight ? "text-white/75" : "text-ink/65"}`}>{r.text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] leading-relaxed text-ink/50">{AIRDROP_NOTE}</p>
        </div>
        {top.length > 0 && (
          <div className="rounded-5xl bg-card p-6 shadow-card">
            <p className="kicker">Leaderboard · {total} on the list</p>
            <ol className="mt-3 space-y-1">
              {top.map((u, i) => (
                <li key={u.handle} className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${state?.handle === u.handle ? "bg-[#FFF4C7]" : ""}`}>
                  <span className={`grid h-6 w-6 place-items-center rounded-full font-mono text-[11px] ${i < 3 ? "bg-ink text-white" : "text-muted"}`}>{i + 1}</span>
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
