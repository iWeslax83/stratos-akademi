"use client";

import { useEffect, useState } from "react";

export function CompetencyToast({ adlar }: { adlar: string[] }) {
  const [show, setShow] = useState(adlar.length > 0);
  useEffect(() => {
    if (adlar.length === 0) return;
    const t = setTimeout(() => setShow(false), 6000);
    return () => clearTimeout(t);
  }, [adlar.length]);

  if (!show || adlar.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-core border border-[#efdfa8] bg-gold-soft px-5 py-4 shadow-[0_20px_50px_-20px_rgba(16,28,55,0.5)] dark:border-gold-dark dark:bg-gold-dark">
      <div className="font-display text-sm font-bold text-[#8a6d12] dark:text-[#ffd54a]">
        🎉 Yeni yetkinlik!
      </div>
      <div className="mt-1 text-sm font-semibold text-navy dark:text-white">{adlar.join(", ")}</div>
    </div>
  );
}
