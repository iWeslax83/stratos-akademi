"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { taraSimdi } from "@/app/actions/video-oneri";

export function TaraSimdiButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  function tara() {
    start(async () => {
      const r = await taraSimdi();
      if (!r.ok) { setMsg(r.error ?? "Hata"); return; }
      setMsg(`Tarandı: ${r.summary?.eklenen ?? 0} yeni öneri, ${r.summary?.budanan ?? 0} budandı.`);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={tara}
        disabled={pending}
        className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50"
      >
        {pending ? "Taranıyor…" : "Şimdi Tara"}
      </button>
      {msg && <span className="text-sm text-navy/70 dark:text-white/70">{msg}</span>}
    </div>
  );
}
