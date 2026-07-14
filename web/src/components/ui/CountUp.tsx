"use client";

import { useEffect, useRef, useState } from "react";
import { countValue } from "@/lib/ui/countup";

const DURATION_MS = 900;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Sayıyı 0'dan value'ya yumuşakça sayar (ilk görünürlükte). prefix ör. "%".
export function CountUp({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || value === 0) {
      const id = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(id);
    }

    let raf = 0;
    let start = 0;
    let running = false;

    const step = (ts: number) => {
      if (!start) start = ts;
      const p = (ts - start) / DURATION_MS;
      setShown(countValue(value, p));
      if (p < 1) raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !running) {
            running = true;
            raf = requestAnimationFrame(step);
            io.disconnect();
          }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  // tabular-nums: sayarken rakam genişliği sabit kalır, sayı zıplamaz.
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {shown}
    </span>
  );
}
