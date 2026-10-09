import { TrustTag } from "./Chips";
import { trustParts } from "@/lib/format";

/** Renders research text with live links and OBSERVED / INFERRED tags. */
export default function Linkify({ text, className = "" }: { text: string | null | undefined; className?: string }) {
  if (!text) return null;
  const parts = trustParts(text);
  return (
    <span className={className}>
      {parts.map((p, i) => (
        <span key={i} className="mr-1">
          {p.trust && <TrustTag trust={p.trust} className="mr-1.5 align-[2px]" />}
          {linkSplit(p.text)}
        </span>
      ))}
    </span>
  );
}

function linkSplit(s: string) {
  const out: React.ReactNode[] = [];
  const re = /https?:\/\/[^\s;,)'"]+/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const url = m[0].replace(/[.]+$/, "");
    const short = url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    out.push(
      <a key={k++} href={url} target="_blank" rel="noopener noreferrer" className="link-u break-all font-mono text-[0.9em]">
        {short.length > 34 ? `${short.slice(0, 34)}…` : short}
      </a>,
    );
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}
