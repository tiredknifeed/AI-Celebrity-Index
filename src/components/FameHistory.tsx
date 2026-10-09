import type { Character } from "@/lib/types";
import { compact, daysBetween, shortDate } from "@/lib/format";

const VW = 1000;
const VH = 270;
const PAD = { l: 56, r: 20, t: 34, b: 44 };

const day = (iso: string) => Date.parse(iso) / 86_400_000;
const afterDebut = (n: number) => (n === 0 ? "on debut day" : `${n} day${n === 1 ? "" : "s"} after debut`);

/**
 * FAME HISTORY in plain terms: how many likes a post gets, week by week.
 * Bars are the average likes per post in each tracked period; dots are single
 * posts, with the peak called out. Three headline numbers sit on top.
 */
export default function FameHistory({ c, accent, asOf }: { c: Character; accent: string; asOf: string }) {
  const debut = c.debut.date ?? c.firstPost;
  const periods = c.trajectory
    .map((p) => ({ start: p.start ?? debut, end: p.end ?? c.lastPost ?? asOf, avg: p.avgLikes, posts: p.posts }))
    .filter((p): p is { start: string; end: string; avg: number; posts: number | null } => !!p.start && !!p.end && p.avg > 0);

  const posts = new Map<string, { date: string; likes: number }>();
  const addPost = (date: string | null | undefined, likes: number | null | undefined) => {
    if (!date || !likes) return;
    const prev = posts.get(date);
    if (!prev || prev.likes < likes) posts.set(date, { date, likes });
  };
  for (const e of c.timeline) if (e.value && e.date) addPost(e.date, e.value);
  addPost(c.peak?.date, c.peak?.likes);
  addPost(c.topPost?.date, c.topPost?.likes);
  addPost(c.topPost14d?.date, c.topPost14d?.likes);
  const dots = [...posts.values()].sort((a, b) => a.date.localeCompare(b.date));
  const peak = c.peak?.likes ? { date: c.peak.date, likes: c.peak.likes } : dots.reduce<{ date: string | null; likes: number } | null>((m, d) => (!m || d.likes > m.likes ? d : m), null);

  // ---- headline numbers ------------------------------------------------------
  const first = periods[0];
  const last = periods[periods.length - 1];
  const now = last?.avg ?? c.avgLikes14d ?? c.avgLikes;
  const change = periods.length > 1 ? last.avg / first.avg - 1 : null;
  const stats: { label: string; value: string; sub: string; tone?: string }[] = [];
  if (peak)
    stats.push({
      label: "Best post",
      value: `${compact(peak.likes)} likes`,
      sub: peak.date ? `${shortDate(peak.date)}${debut && peak.date >= debut ? ` · ${afterDebut(daysBetween(debut, peak.date))}` : ""}` : "date not captured",
    });
  if (now)
    stats.push({
      label: "A typical post now",
      value: `${compact(now)} likes`,
      sub: last ? `average, ${shortDate(last.start)} – ${shortDate(last.end)}` : "average of recent posts",
    });
  if (change !== null)
    stats.push({
      label: "Since the first week",
      value: `${change >= 0 ? "+" : "−"}${Math.abs(Math.round(change * 100))}%`,
      sub: `${compact(first.avg)} → ${compact(last.avg)} likes per post`,
      tone: change >= 0 ? "text-[#0d7a3e]" : "text-[#c0262c]",
    });

  // a handful of loose dots says little: draw only with periods or enough posts
  const canDraw = periods.length > 0 || dots.length >= 4;

  return (
    <figure>
      {stats.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-3xl bg-paper p-4">
              <p className="kicker">{s.label}</p>
              <p className={`display mt-1 text-3xl leading-none sm:text-4xl ${s.tone ?? ""}`}>{s.value}</p>
              <p className="mt-1.5 text-xs text-ink/60">{s.sub}</p>
            </div>
          ))}
        </div>
      )}
      {canDraw ? (
        <Chart periods={periods} dots={dots} peakDate={peak?.date ?? null} accent={accent} debut={debut} asOf={asOf} name={c.name} />
      ) : (
        <p className="mt-4 text-sm text-muted">Week-by-week likes were not captured for this character, so there is no chart yet.</p>
      )}
      {canDraw && <figcaption className="mt-3 text-xs leading-relaxed text-ink/60">
        {periods.length > 0 && (
          <>
            <span className="mr-1 inline-block h-2.5 w-4 rounded-sm align-middle" style={{ background: accent }} /> average likes per post in that period ·{" "}
          </>
        )}
        <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full border-2 border-ink bg-white align-middle" /> a single post · Likes are the
        public measure of attention (views are not public). Log scale, so each line is 10× the one below.
      </figcaption>}
    </figure>
  );
}

function Chart({
  periods,
  dots,
  peakDate,
  accent,
  debut,
  asOf,
  name,
}: {
  periods: { start: string; end: string; avg: number; posts: number | null }[];
  dots: { date: string; likes: number }[];
  peakDate: string | null;
  accent: string;
  debut: string | null;
  asOf: string;
  name: string;
}) {
  const dates = [...periods.flatMap((p) => [p.start, p.end]), ...dots.map((d) => d.date), ...(debut ? [debut] : [])];
  const x0 = Math.min(...dates.map(day)) - 0.5;
  const x1 = Math.max(...dates.map(day), periods.length ? 0 : day(asOf)) + 1;
  const values = [...periods.map((p) => p.avg), ...dots.map((d) => d.likes)];
  const yMin = Math.pow(10, Math.floor(Math.log10(Math.min(...values) * 0.8)));
  const yMax = Math.pow(10, Math.ceil(Math.log10(Math.max(...values) * 1.15)));
  const X = (iso: string) => PAD.l + ((day(iso) - x0) / (x1 - x0)) * (VW - PAD.l - PAD.r);
  const Y = (v: number) => VH - PAD.b - ((Math.log10(v) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin))) * (VH - PAD.t - PAD.b);
  const ticks: number[] = [];
  for (let v = yMin; v <= yMax; v *= 10) ticks.push(v);
  const base = VH - PAD.b;

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="mt-5 h-auto w-full" role="img" aria-label={`Likes per post over time for ${name}`}>
      <text x={PAD.l} y={14} className="fill-muted font-mono" fontSize={12}>
        LIKES PER POST
      </text>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={VW - PAD.r} y1={Y(t)} y2={Y(t)} stroke="#141414" strokeOpacity={0.08} />
          <text x={PAD.l - 8} y={Y(t) + 4} textAnchor="end" className="fill-muted font-mono" fontSize={12}>
            {compact(t)}
          </text>
        </g>
      ))}

      {periods.map((p, i) => {
        const xa = X(p.start) + 3;
        const xb = Math.max(X(p.end) - 3, xa + 18);
        const y = Y(p.avg);
        return (
          <g key={i}>
            <rect x={xa} y={y} width={xb - xa} height={base - y} rx={10} fill={accent} fillOpacity={0.55} />
            <rect x={xa} y={y} width={xb - xa} height={4} rx={2} fill="#141414" />
            <text x={(xa + xb) / 2} y={y - 8} textAnchor="middle" fontSize={15} fontWeight={800} className="fill-ink font-display">
              {compact(p.avg)}
            </text>
            <text x={(xa + xb) / 2} y={base + 18} textAnchor="middle" fontSize={11.5} className="fill-muted font-mono">
              {shortDate(p.start)}
              {p.end !== p.start ? `–${shortDate(p.end).replace(/^[A-Z]{3} /, "")}` : ""}
            </text>
            {p.posts !== null && (
              <text x={(xa + xb) / 2} y={base + 33} textAnchor="middle" fontSize={10.5} className="fill-muted font-mono">
                {p.posts} post{p.posts === 1 ? "" : "s"}
              </text>
            )}
          </g>
        );
      })}

      {!periods.length &&
        dots.map((d) => (
          <text key={`x-${d.date}`} x={X(d.date)} y={base + 18} textAnchor="middle" fontSize={11.5} className="fill-muted font-mono">
            {shortDate(d.date)}
          </text>
        ))}

      {dots.map((d) => {
        const isPeak = d.date === peakDate;
        const x = X(d.date);
        const y = Y(d.likes);
        return (
          <g key={d.date}>
            <circle cx={x} cy={y} r={isPeak ? 8 : 5} fill={isPeak ? "#FF4D1F" : "#fff"} stroke="#141414" strokeWidth={2.5} />
            {isPeak && (
              <g transform={x + 140 > VW - PAD.r ? `translate(${-142},0)` : undefined}>
                <rect x={x + 12} y={y - 13} width={118} height={24} rx={12} fill="#141414" />
                <text x={x + 71} y={y + 3.5} textAnchor="middle" fill="#fff" fontSize={12.5} fontWeight={700} className="font-mono">
                  best · {compact(d.likes)}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
