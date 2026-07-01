"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { geriGetir } from "@/app/actions/video-oneri";

type Props = { id: string; youtubeId: string; baslik: string; rejectedAt: string | null };

export function CopKutusuKarti(p: Props) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function restore() {
    start(async () => {
      const r = await geriGetir(p.id);
      if (!r.ok) { window.alert(r.error ?? "Hata"); return; }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <a
          href={`https://www.youtube.com/watch?v=${p.youtubeId}`}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-navy underline-offset-2 hover:underline dark:text-white"
        >
          {p.baslik}
        </a>
        <p className="text-xs text-navy/60 dark:text-white/60">
          {p.rejectedAt ? `Reddedildi: ${new Date(p.rejectedAt).toLocaleDateString("tr-TR")}` : ""}
        </p>
      </div>
      <button onClick={restore} disabled={pending} className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-navy disabled:opacity-50 dark:bg-white/10 dark:text-white">
        Geri getir
      </button>
    </div>
  );
}
