import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";

/** Fades content in once when scrolled into view. SSR/no-JS: fully visible. */
export function Reveal({ children, className = "", delay = 0, style }: { children: ReactNode; className?: string; delay?: number; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight) return; // already on screen: no flash
    el.dataset["reveal"] = "pending";
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setTimeout(() => (el.dataset["reveal"] = "in"), delay);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return (
    <div ref={ref} className={`reveal ${className}`} style={style}>
      {children}
    </div>
  );
}