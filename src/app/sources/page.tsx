import type { Metadata } from "next";
import PageHead from "@/components/PageHead";
import { AS_OF, dataset, sources } from "@/lib/data";
import { compact, longDate } from "@/lib/format";

export const metadata: Metadata = { title: "Sources" };

export default function SourcesPage() {
  const method = sources.filter((s) => (s.type ?? "").startsWith("Method"));
  const secondary = sources.filter((s) => (s.type ?? "").startsWith("Secondary"));
  const profiles = sources.filter((s) => (s.type ?? "").startsWith("Instagram"));
  const other = sources.filter((s) => !method.includes(s) && !secondary.includes(s) && !profiles.includes(s));
  return (
    <>
      <PageHead
        kicker={`${sources.length} sources · last updated ${longDate(AS_OF)}`}
        title="Sources"
        intro={`Every number on this site traces back to a public Instagram profile captured on ${longDate(AS_OF)}. Press articles are used for context only and are labelled as such.`}
      />
      <section className="wrap grid gap-4 lg:grid-cols-2">
        <SourceList title="Method" items={method} />
        <SourceList title="Press & secondary (context only)" items={secondary} />
      </section>
      <section id="instagram" className="wrap mt-4 scroll-mt-28">
        <SourceList title={`Instagram profiles (${profiles.length})`} items={profiles} columns />
      </section>
      {other.length > 0 && (
        <section className="wrap mt-4">
          <SourceList title="Other" items={other} />
        </section>
      )}
      <section id="excluded" className="wrap mt-4 scroll-mt-28">
        <div className="panel p-6 sm:p-8">
          <h2 className="display text-4xl">Excluded</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink/70">
            Reviewed and left out on purpose: copycats, inactive accounts, real people, compilations and empty search results.
          </p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {dataset.excluded.map((e) => (
              <li key={e.handle} className="rounded-3xl bg-paper p-4">
                <a href={e.profileUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                  {e.name} ↗
                </a>
                <div className="font-mono text-xs text-muted">
                  @{e.handle}
                  {e.followers ? ` · ${compact(e.followers)} followers` : ""}
                </div>
                <p className="mt-1 text-sm text-ink/70">{e.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="wrap mt-4">
        <div className="panel p-6 text-sm text-ink/70 sm:p-8">
          Dataset: <span className="font-mono">{dataset.meta.generatedFrom}</span>. {dataset.meta.legend} Portrait photos are stills from
          the supplied promo video; illustrations are drawn from each character’s described look and labelled on the profile.
        </div>
      </section>
    </>
  );
}

function SourceList({ title, items, columns = false }: { title: string; items: typeof sources; columns?: boolean }) {
  return (
    <div className="panel p-6 sm:p-8">
      <h2 className="display text-3xl">{title}</h2>
      <ul className={`mt-4 ${columns ? "grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col"}`}>
        {items.map((s) => (
          <li key={s.n} className="border-t border-line py-3">
            <a href={s.url ?? "#"} target="_blank" rel="noopener noreferrer" className="font-semibold leading-snug hover:underline">
              {s.title} ↗
            </a>
            {!columns && <p className="mt-1 text-sm text-muted">{s.usedFor}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
