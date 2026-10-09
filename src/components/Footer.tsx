import Link from "next/link";
import { longDate } from "@/lib/format";

export default function Footer({ asOf }: { asOf: string }) {
  return (
    <footer className="mt-24 bg-ink pb-28 pt-16 text-white md:pb-12">
      <div className="wrap">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div>
            <p className="display text-[13vw] leading-[0.82] md:text-[7.5vw]">
              AI Fame
              <br />
              Index<span className="text-[#C6F432]">★</span>
            </p>
            <p className="mt-4 font-mono text-sm text-white/60">tracking synthetic fame on the internet.</p>
          </div>
          <div className="flex flex-col gap-6 md:items-end">
            <ul className="flex flex-wrap gap-2">
              {[
                ["Add a character", "/submit/"],
                ["Methodology", "/methodology/"],
                ["Sources", "/sources/"],
                ["Instagram", "/sources/#instagram"],
                ["About", "/about/"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-block rounded-full border border-white/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] transition-colors hover:bg-white hover:text-ink"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="max-w-sm font-mono text-[11px] leading-relaxed text-white/45 md:text-right">
              Last updated {longDate(asOf)}. Scores are an index methodology, not objective truth. Parody personas
              are not affiliated with the people or IP they reference. Data: public Instagram profiles.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
