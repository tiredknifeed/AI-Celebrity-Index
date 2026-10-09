import type { TimelineEvent } from "@/lib/types";

export interface ArcEvent extends Omit<TimelineEvent, "kind"> {
  kind: TimelineEvent["kind"] | "now";
  stage: string;
}

export const KIND_STYLE: Record<ArcEvent["kind"], { bg: string; fg: string; icon: string }> = {
  debut: { bg: "#141414", fg: "#fff", icon: "✦" },
  viral: { bg: "#FF8A1F", fg: "#fff", icon: "↗" },
  peak: { bg: "#FF4D1F", fg: "#fff", icon: "★" },
  token: { bg: "#C6F432", fg: "#141414", icon: "◎" },
  collab: { bg: "#18A957", fg: "#fff", icon: "⇄" },
  milestone: { bg: "#5B8DEF", fg: "#fff", icon: "◆" },
  moment: { bg: "#FFFDF8", fg: "#141414", icon: "•" },
  now: { bg: "#F2B705", fg: "#141414", icon: "●" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (iso: string | null) => (iso ? `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}` : "date unknown");

function likes(n: number | null): string | null {
  if (!n) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/0$/, "")}M likes`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K likes`;
  return `${n} likes`;
}

/**
 * Career story as one horizontal strip: debut → viral posts → collabs → token →
 * now. Scrolls sideways when there are many steps.
 */
export default function CareerArc({ events }: { events: ArcEvent[] }) {
  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4 pb-2">
      <ol className="relative flex min-w-max gap-3 pt-1">
        <span aria-hidden className="absolute left-5 right-5 top-[23px] h-[3px] rounded-full bg-gradient-to-r from-ink/15 via-ink/25 to-[#F2B705]" />
        {events.map((e, i) => {
          const s = KIND_STYLE[e.kind];
          const value = likes(e.value);
          const inferred = e.status !== "OBSERVED";
          return (
            <li key={`${e.date}-${i}`} className="relative flex w-[210px] shrink-0 flex-col sm:w-[230px]">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full text-base shadow-sticker"
                  style={{ background: s.bg, color: s.fg, border: s.bg === "#FFFDF8" ? "2px solid #141414" : undefined }}
                >
                  {s.icon}
                </span>
                <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink/70">{day(e.date)}</span>
              </div>
              <div className="mt-3 flex-1 rounded-3xl bg-card p-4 shadow-card" style={e.kind === "now" ? { background: "#FFF4C7" } : undefined}>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: s.bg === "#FFFDF8" || s.bg === "#C6F432" ? "#141414" : s.bg }}>
                  {e.stage}
                  {inferred && <span className="ml-1.5 font-normal normal-case tracking-normal text-muted">· inferred</span>}
                </p>
                {value && <p className="display mt-1.5 text-2xl leading-none">{value}</p>}
                <p className="mt-1.5 line-clamp-3 text-sm font-semibold leading-snug">{e.label}</p>
                {e.url && (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block font-mono text-[10.5px] uppercase tracking-[0.12em] underline decoration-ink/30 underline-offset-4"
                  >
                    Post ↗
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
