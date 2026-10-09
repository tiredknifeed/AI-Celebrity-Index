export default function PageHead({
  kicker,
  title,
  intro,
  children,
}: {
  kicker: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="wrap pb-10 pt-32 sm:pt-36">
      <p className="kicker mb-4">{kicker}</p>
      <h1 className="display text-[16vw] sm:text-8xl lg:text-[9rem]">{title}</h1>
      {intro && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/70">{intro}</p>}
      {children}
    </header>
  );
}
