import type { Heat, Identity, StatusCode, Trust } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/labels";

const STATUS_STYLE: Record<StatusCode, { glyph: string; cls: string; dot?: string }> = {
  ACTIVE_TODAY: { glyph: "●", cls: "bg-live/15 text-[#0d7a3e]", dot: "bg-live" },
  POSTING: { glyph: "●", cls: "bg-live/10 text-[#0d7a3e]" },
  BREAKING_OUT: { glyph: "↑", cls: "bg-fire text-white" },
  STABLE: { glyph: "→", cls: "bg-ink/[0.06] text-ink" },
  COOLING: { glyph: "↓", cls: "bg-cooling/20 text-[#3d5f7a]" },
  DORMANT: { glyph: "○", cls: "bg-ink/[0.05] text-muted" },
  UNKNOWN: { glyph: "?", cls: "bg-ink/[0.05] text-muted" },
};

export function StatusChip({ code, className = "", solid = false }: { code: StatusCode; className?: string; solid?: boolean }) {
  const s = STATUS_STYLE[code];
  // On coloured backgrounds the translucent variants need a white base.
  const cls = solid && code !== "BREAKING_OUT" ? `${s.cls.replace(/bg-\S+/, "")} bg-white/90 backdrop-blur` : s.cls;
  return (
    <span className={`chip ${cls} ${className}`} title="Live status from the latest captured post (09 Oct 2026)">
      {s.dot ? (
        <span className="relative inline-flex h-2 w-2">
          <span className={`absolute inset-0 rounded-full ${s.dot} animate-pulseRing`} />
          <span className={`relative h-2 w-2 rounded-full ${s.dot}`} />
        </span>
      ) : (
        <span aria-hidden>{s.glyph}</span>
      )}
      {STATUS_LABEL[code]}
    </span>
  );
}

export const HEAT_STYLE: Record<Heat, { cls: string; color: string; arrow: string }> = {
  "ON FIRE": { cls: "bg-fire text-white", color: "#FF4D1F", arrow: "↑↑" },
  HOT: { cls: "bg-hot text-white", color: "#FF8A1F", arrow: "↑" },
  RISING: { cls: "bg-rising text-ink", color: "#F2B705", arrow: "↗" },
  STEADY: { cls: "bg-steady/15 text-[#2c5bc0]", color: "#5B8DEF", arrow: "→" },
  COOLING: { cls: "bg-cooling/25 text-[#3d5f7a]", color: "#8AA9C2", arrow: "↘" },
  DORMANT: { cls: "bg-ink/[0.06] text-muted", color: "#A8A296", arrow: "·" },
};

export function HeatChip({ heat, className = "" }: { heat: Heat; className?: string }) {
  const s = HEAT_STYLE[heat];
  return (
    <span className={`chip ${s.cls} ${className}`}>
      <span aria-hidden>{s.arrow}</span>
      {heat}
    </span>
  );
}

const IDENTITY_STYLE: Record<Identity, { cls: string; label: string; long: string; glyph: string }> = {
  VERIFIED: {
    cls: "bg-ink text-white",
    label: "Verified",
    long: "Instagram verified badge observed",
    glyph: "✓",
  },
  OFFICIAL: {
    cls: "bg-white text-ink ring-1 ring-ink/15",
    label: "Official",
    long: "Canonical account is clear (self-declared or referenced by other characters); no badge",
    glyph: "◆",
  },
  UNVERIFIED: {
    cls: "bg-white text-muted ring-1 ring-ink/10",
    label: "Unverified",
    long: "Name and content match, but no badge or cross-references; copycats may exist",
    glyph: "◇",
  },
  PARODY: {
    cls: "bg-[#FFE45C] text-ink",
    label: "Parody",
    long: "Parody / unofficial AI persona. Not affiliated with the person or IP it references.",
    glyph: "!",
  },
  COMMUNITY: {
    cls: "bg-[#DCE8FF] text-ink",
    label: "Added by a user",
    long: "Added by a user through the submission form. The data is pulled automatically from the public Instagram profile; the identity is not verified by the index.",
    glyph: "+",
  },
  UNKNOWN: { cls: "bg-ink/[0.05] text-muted", label: "Unknown", long: "Identity could not be checked", glyph: "?" },
};

export function IdentityBadge({
  identity,
  long = false,
  className = "",
}: {
  identity: Identity;
  long?: boolean;
  className?: string;
}) {
  const s = IDENTITY_STYLE[identity];
  return (
    <span className={`chip ${s.cls} ${className}`} title={s.long}>
      <span aria-hidden className="font-bold">
        {s.glyph}
      </span>
      {long && identity === "PARODY" ? "Parody / unofficial AI persona" : s.label}
    </span>
  );
}

export function identityExplainer(identity: Identity): string {
  return IDENTITY_STYLE[identity].long;
}

const TRUST_STYLE: Record<Trust, string> = {
  OBSERVED: "text-[#0d7a3e] border-[#0d7a3e]/30",
  INFERRED: "text-[#9a5b00] border-[#9a5b00]/30",
  UNKNOWN: "text-muted border-ink/20",
};

export function TrustTag({ trust, className = "" }: { trust: Trust; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-[1px] font-mono text-[9.5px] uppercase tracking-[0.1em] ${TRUST_STYLE[trust]} ${className}`}
      title={
        trust === "OBSERVED"
          ? "Seen directly on Instagram"
          : trust === "INFERRED"
            ? "Analyst or rule-based interpretation"
            : "Not verifiable from Instagram"
      }
    >
      {trust}
    </span>
  );
}

export function UniverseTag({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`chip bg-ink/[0.05] text-ink/70 ${className}`}>
      <span aria-hidden>✺</span>
      {name}
    </span>
  );
}
