"use client";

import { useEffect, useState } from "react";

// Sağ-alt geçici bildirim (yeni yetkinlik için).
export function Toast({ baslik, adlar }: { baslik: string; adlar: string[] }) {
  const [show, setShow] = useState(adlar.length > 0);
  useEffect(() => {
    if (adlar.length === 0) return;
    const t = setTimeout(() => setShow(false), 6000);
    return () => clearTimeout(t);
  }, [adlar.length]);

  if (!show || adlar.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-core border border-accent/40 bg-accent-wash px-5 py-4 shadow-[0_20px_50px_-20px_rgba(16,28,55,0.5)] dark:border-accent-dark">
      <div className="font-display text-sm font-bold text-accent-fg">{baslik}</div>
      <div className="mt-1 text-sm font-semibold text-fg">{adlar.join(", ")}</div>
    </div>
  );
}
