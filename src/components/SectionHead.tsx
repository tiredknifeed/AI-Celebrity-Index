import Link from "next/link";

export default function SectionHead({
  kicker,
  title,
  intro,
  href,
  cta,
  id,
}: {
  kicker: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  href?: string;
  cta?: string;
  id?: string;
}) {
  return (
    <div id={id} className="mb-8 flex scroll-mt-28 flex-col justify-between gap-5 md:mb-10 md:flex-row md:items-end">
      <div className="max-w-3xl">
        <p className="kicker mb-3">{kicker}</p>
        <h2 className="display text-[13vw] sm:text-7xl lg:text-8xl">{title}</h2>
        {intro && <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-ink/70">{intro}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="w-fit shrink-0 rounded-full border-2 border-ink px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-white"
        >
          {cta ?? "See all"} →
        </Link>
      )}
    </div>
  );
}
