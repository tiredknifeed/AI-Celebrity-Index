import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap flex min-h-[70vh] flex-col items-start justify-center pt-32">
      <p className="kicker">404</p>
      <h1 className="display mt-3 text-7xl sm:text-9xl">Not famous yet.</h1>
      <p className="mt-4 text-lg text-ink/70">This character is not in the index. Maybe next week.</p>
      <Link href="/chart/" className="mt-8 rounded-full bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.14em] text-white">
        Back to the chart →
      </Link>
    </section>
  );
}
