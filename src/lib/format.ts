const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** 63330 -> "63.3K", 3150423 -> "3.15M". */
export function compact(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v >= 10 ? v.toFixed(1) : v.toFixed(2)}M`.replace(/\.0+M$/, "M");
  }
  if (abs >= 1_000) {
    const v = n / 1_000;
    return `${v >= 100 ? v.toFixed(0) : v.toFixed(1)}K`.replace(/\.0K$/, "K");
  }
  return `${Math.round(n)}`;
}

export function full(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return Math.round(n).toLocaleString("en-US");
}

/** "2026-09-23" -> "SEP 23". */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [, m, d] = iso.split("-");
  return `${MONTHS[Number(m) - 1]} ${d}`;
}

/** "2026-10-09" -> "09 OCT 2026". */
export function longDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
}

export function score(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined) return "—";
  return n.toFixed(digits);
}

export function pct(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** Splits "OBSERVED: foo. INFERRED: bar" into labelled parts. */
export function trustParts(s: string | null | undefined): { trust: "OBSERVED" | "INFERRED" | "UNKNOWN" | null; text: string }[] {
  if (!s) return [];
  const re = /(OBSERVED|INFERRED|UNKNOWN)(?:\s*\([^)]*\))?\s*:\s*/g;
  const out: { trust: "OBSERVED" | "INFERRED" | "UNKNOWN" | null; text: string }[] = [];
  let last = 0;
  let current: "OBSERVED" | "INFERRED" | "UNKNOWN" | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const chunk = s.slice(last, m.index).trim();
    if (chunk) out.push({ trust: current, text: chunk });
    current = m[1] as "OBSERVED" | "INFERRED" | "UNKNOWN";
    last = re.lastIndex;
  }
  const rest = s.slice(last).trim();
  if (rest) out.push({ trust: current, text: rest });
  return out;
}

/** Drops the leading "OBSERVED:" style prefix. */
export function stripTrust(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/^(OBSERVED|INFERRED|UNKNOWN)(\s*\([^)]*\))?\s*:\s*/, "");
}
