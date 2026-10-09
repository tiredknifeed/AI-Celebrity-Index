import Link from "next/link";
import Portrait from "./Portrait";
import { avatarBg, portraitOf } from "@/data/portraits";
import type { Story } from "@/lib/data";

const TONES: Record<string, string> = {
  "biggest-this-week": "#141414",
  "fastest-rising": "#FF4D1F",
  "most-connected": "#18A957",
  "biggest-fall": "#5B8DEF",
  "new-arrivals": "#F2B705",
  "most-viral": "#E0559A",
};

/** Auto-generated editorial modules that turn the numbers into culture. */
export default function Stories({ stories }: { stories: Story[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {stories.map((s) => {
        const lead = s.items[0];
        if (!lead) return null;
        const tone = TONES[s.id] ?? "#141414";
        const spec = portraitOf(lead.c.slug);
        return (
          <article key={s.id} className="panel flex flex-col overflow-hidden">
            <Link href={`/c/${lead.c.slug}/`} className="group relative block h-56 overflow-hidden" style={avatarBg(lead.c.slug)}>
              <div className="grain absolute inset-0 opacity-60" />
              <Portrait
                c={lead.c}
                variant="cutout"
                className="absolute bottom-0 right-0 h-[105%] w-[62%] transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute left-5 top-5 max-w-[52%]">
                <span className="chip text-white" style={{ background: tone }}>
                  {s.title}
                </span>
                <div className="display mt-3 text-[56px] leading-none tabular-nums">{lead.stat}</div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink/70">{lead.label}</div>
              </div>
              <div className="absolute bottom-4 left-5 display max-w-[46%] text-2xl leading-[0.9]">{lead.c.name}</div>
            </Link>
            <div className="flex flex-1 flex-col gap-1 p-4">
              <p className="kicker mb-1">{s.kicker}</p>
              {s.items.slice(1).map((it, i) => (
                <Link
                  key={it.c.slug}
                  href={`/c/${it.c.slug}/`}
                  className="flex items-center gap-3 rounded-2xl p-1.5 transition-colors hover:bg-ink/[0.04]"
                >
                  <span className="w-5 font-mono text-xs text-muted">{i + 2}</span>
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl" style={avatarBg(it.c.slug)}>
                    <Portrait c={it.c} variant="compact" className="absolute inset-0 h-full w-full" />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-display text-[15px] font-extrabold uppercase">{it.c.name}</span>
                  <span className="font-display text-lg font-extrabold tabular-nums">{it.stat}</span>
                </Link>
              ))}
              <p className="mt-auto pt-3 text-[11.5px] leading-snug text-muted">{s.basis}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
