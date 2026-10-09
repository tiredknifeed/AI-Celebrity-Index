/** The AI Fame Index mark: a broken lime star in a black disc. */
export const STAR_PATH = "M78.4 13.5L53.1 27.5L64.1 27.7L48 38.5L27.1 27.7L31.3 46.7L8.8 57.1L33.9 63.4L34 88.2L53.5 65.2L83.1 68.2L62.2 50.5Q72 30 78.4 13.5Z";

export default function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="50" r="50" fill="#0A0A0A" />
      <path d={STAR_PATH} fill="#DFFC08" />
    </svg>
  );
}
