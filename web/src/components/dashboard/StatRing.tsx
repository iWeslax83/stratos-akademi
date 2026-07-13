"use client";

import { useEffect, useState } from "react";
import { CountUp } from "@/components/ui/CountUp";

// İlerleme çubuğu mount'ta 0'dan pct'ye animasyonla dolar; yüzde sayar.
export function StatRing({ pct, label }: { pct: number; label: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 60);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="flex h-full flex-col justify-center p-5">
      <div className="font-display text-3xl font-extrabold leading-none text-navy dark:text-white">
        <CountUp value={pct} prefix="%" />
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-out"
          style={{ width: `${w}%` }}
        />
      </div>
      <div className="mt-2 text-xs font-semibold text-muted">{label}</div>
    </div>
  );
}
