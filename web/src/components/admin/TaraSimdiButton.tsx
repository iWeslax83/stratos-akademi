"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { taraSimdi } from "@/app/actions/video-oneri";
import { neOldu } from "@/lib/videos/diag-text";

export function TaraSimdiButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [hata, setHata] = useState(false);
  const router = useRouter();

  function tara() {
    start(async () => {
      const r = await taraSimdi();
      if (!r.ok) {
        setHata(true);
        setMsg(r.error ?? "Hata");
        return;
      }
      setHata(false);
      const s = r.summary;
      const eklenen = s?.eklenen ?? 0;
      const sebep = s?.diag ? neOldu(s.diag) : null;
      setMsg(
        eklenen > 0
          ? `${eklenen} yeni öneri eklendi${s?.budanan ? `, ${s.budanan} budandı` : ""}.`
          : `Öneri çıkmadı. ${sebep ?? "Sebep tarama geçmişinde."}`,
      );
      router.refresh();
    });
  }

  return (
    <div className="flex max-w-lg items-start gap-3">
      <button
        onClick={tara}
        disabled={pending}
        className="shrink-0 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50"
      >
        {pending ? "Taranıyor…" : "Şimdi Tara"}
      </button>
      {msg && (
        <span
          className={
            hata
              ? "text-sm text-red-600 dark:text-red-400"
              : "text-sm text-navy/70 dark:text-white/70"
          }
        >
          {msg}
        </span>
      )}
    </div>
  );
}
