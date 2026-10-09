import type { Character } from "@/lib/types";
import { compact, shortDate } from "@/lib/format";

const VW = 1000;
const VH = 380;
const PAD = { l: 64, r: 24, t: 58, b: 40 };

const day = (iso: string) => Date.parse(iso) / 86_400_000;

/**
 * FAME HISTORY: attention over time, drawn like a stock chart but in likes,
 * never price. Steps are average likes per post per period; dots are single
 * posts; pins are career events.
 */
export default function FameHistory({ c, accent, asOf }: { c: Character; accent: string; asOf: string }) {
  const debut = c.debut.date ?? c.firstPost;
  const periods = c.trajectory
    .map((p) => ({
      start: p.start ?? debut,
      end: p.end ?? c.lastPost ?? asOf,
      avg: p.avgLikes,
      posts: p.posts,
      label: p.label,
    }))
    .filter((p): p is { start: string; end: string; avg: number; posts: number | null; label: string } => !!p.start && !!p.end);

  const posts = new Map<string, { date: string; likes: number; label: string }>();
  const addPost = (date: string | null | undefined, likes: number | null | undefined, label: string) => {
    if (!date || !likes) return;
    const prev = posts.get(date);
    if (!prev || prev.likes < likes) posts.set(date, { date, likes, label });
  };
  for (const e of c.timeline) if (e.value && e.date) addPost(e.date, e.value, e.label);
  addPost(c.peak?.date, c.peak?.likes, "Peak post");
  addPost(c.topPost?.date, c.topPost?.likes, "Top post");
  addPost(c.topPost14d?.date, c.topPost14d?.likes, "Best post, last 14 days");
  const dots = [...posts.values()].sort((a, b) => a.date.localeCompare(b.date));

  const pins = c.timeline.filter((e) => e.date && ["debut", "token", "collab", "milestone"].includes(e.kind));

  const dates = [debut, asOf, ...periods.flatMap((p) => [p.start, p.end]), ...dots.map((d) => d.date), ...pins.map((p) => p.date!)].filter(
    (d): d is string => !!d,
  );
  if (dates.length < 2 || (dots.length === 0 && periods.length === 0)) {
    return <p className="text-sm text-muted">Not enough dated data points to draw a fame history yet.</p>;
  }
  const x0 = Math.min(...dates.map(day)) - 1;
  const x1 = Math.max(...dates.map(day)) + 1;
  const values = [...periods.map((p) => p.avg), ...dots.map((d) => d.likes), c.avgLikes ?? 0].filter((v) => v > 0);
  const yMin = Math.pow(10, Math.floor(Math.log10(Math.min(...values) * 0.8)));
  const yMax = Math.pow(10, Math.ceil(Math.log10(Math.max(...values) * 1.2)));

  const X = (iso: string) => PAD.l + ((day(iso) - x0) / (x1 - x0)) * (VW - PAD.l - PAD.r);
  const Y = (v: number) => {
    const t = (Math.log10(v) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin));
    return VH - PAD.b - t * (VH - PAD.t - PAD.b);
  };

  // step line through period averages
  let step = "";
  periods.forEach((p, i) => {
    const xa = X(p.start);
    const xb = X(p.end);
    const y = Y(p.avg);
    step += `${i === 0 ? "M" : "L"}${xa},${y} L${xb},${y} `;
  });
  const area = periods.length
    ? `${step} L${X(periods[periods.length - 1].end)},${VH - PAD.b} L${X(periods[0].start)},${VH - PAD.b} Z`
    : "";

  const ticks: number[] = [];
  for (let v = yMin; v <= yMax; v *= 10) ticks.push(v);

  const xTicks: string[] = [];
  const startDay = Math.ceil(x0);
  const span = x1 - x0;
  const every = span > 400 ? 60 : span > 120 ? 30 : span > 40 ? 7 : 3;
  for (let d = startDay; d <= x1; d += every) xTicks.push(new Date(d * 86_400_000).toISOString().slice(0, 10));

  const recentY = c.avgLikes ? Y(c.avgLikes) : null;

  return (
    <figure>
      <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full" role="img" aria-label={`Fame history of ${c.name}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={VW - PAD.r} y1={Y(t)} y2={Y(t)} stroke="#141414" strokeOpacity={0.08} />
            <text x={PAD.l - 10} y={Y(t) + 4} textAnchor="end" className="fill-muted font-mono" fontSize={12}>
              {compact(t)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={X(t)} y={VH - PAD.b + 22} textAnchor="middle" className="fill-muted font-mono" fontSize={12}>
            {shortDate(t)}
          </text>
        ))}

        {/* event pins */}
        {pins.map((p, i) => (
          <g key={`${p.date}-${i}`}>
            <line x1={X(p.date!)} x2={X(p.date!)} y1={PAD.t - 18} y2={VH - PAD.b} stroke="#141414" strokeOpacity={0.3} strokeDasharray="3 4" />
            <circle cx={X(p.date!)} cy={PAD.t - 26} r={11} fill="#141414" />
            <text x={X(p.date!)} y={PAD.t - 22} textAnchor="middle" fill="#fff" fontSize={11} className="font-mono">
              {i + 1}
            </text>
          </g>
        ))}

        {area && <path d={area} fill={accent} fillOpacity={0.45} />}
        {step && <path d={step} fill="none" stroke="#141414" strokeWidth={3} strokeLinejoin="round" />}

        {recentY !== null && (
          <g>
            <line
              x1={X(c.lastPost ?? asOf) - 120}
              x2={X(c.lastPost ?? asOf)}
              y1={recentY}
              y2={recentY}
              stroke="#141414"
              strokeWidth={2}
              strokeDasharray="6 5"
            />
            <text x={X(c.lastPost ?? asOf) - 124} y={recentY - 8} textAnchor="start" fontSize={11} className="fill-ink font-mono">
              avg, last 12 posts: {compact(c.avgLikes)}
            </text>
          </g>
        )}

        {dots.map((d) => {
          const isPeak = c.peak?.date === d.date;
          return (
            <g key={d.date}>
              <circle cx={X(d.date)} cy={Y(d.likes)} r={isPeak ? 9 : 6} fill={isPeak ? "#FF4D1F" : "#fff"} stroke="#141414" strokeWidth={2.5} />
              <text
                x={X(d.date)}
                y={Y(d.likes) - 14}
                textAnchor="middle"
                fontSize={isPeak ? 15 : 12}
                fontWeight={isPeak ? 800 : 500}
                className={isPeak ? "fill-ink font-display" : "fill-ink font-mono"}
              >
                {compact(d.likes)}
                {isPeak ? " · peak" : ""}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] text-muted">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-5 rounded-sm" style={{ background: accent, opacity: 0.6 }} /> Avg likes per post, by period
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-ink bg-white" /> Single post
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-ink bg-fire" /> Peak post
        </span>
        <span>Log scale. Likes are the attention proxy (Reel views are not public). Not a price.</span>
      </figcaption>
      {pins.length > 0 && (
        <ol className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">
          {pins.map((p, i) => (
            <li key={`${p.date}-${i}`} className="flex gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink font-mono text-[10px] text-white">{i + 1}</span>
              <span>
                <span className="font-mono text-xs text-muted">{shortDate(p.date)}</span> {p.label}
              </span>
            </li>
          ))}
        </ol>
      )}
    </figure>
  );
}
