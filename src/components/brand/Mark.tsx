/** NOCTURNE monogram: an N drawn as two verticals joined by a // diagonal pair. */
export function Mark({ className = "", draw = false }: { className?: string; draw?: boolean }) {
  const d = draw ? "animate-draw" : "";
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="24" cy="24" r="22.5" strokeOpacity=".35" pathLength={1} className={d} />
      <path d="M14 34V14" pathLength={1} className={d} />
      <path d="M34 34V14" pathLength={1} className={d} />
      <path d="M14.5 14.5 L28 33.5" pathLength={1} className={d} style={{ animationDelay: "200ms" }} />
      <path d="M20 14.5 L33.5 33.5" pathLength={1} className={d} strokeOpacity=".55" style={{ animationDelay: "320ms" }} />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`font-display tracking-[0.22em] ${className}`}>NOCTURNE</span>;
}
