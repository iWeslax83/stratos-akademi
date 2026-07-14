"use client";

import { geriGetir } from "@/app/actions/video-oneri";
import { ErrorText } from "@/components/ui/ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";

type Props = { id: string; youtubeId: string; baslik: string; rejectedAt: string | null };

export function CopKutusuKarti(p: Props) {
  const { pending, error, run } = useServerAction("Hata");

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
      <span>
        <button onClick={() => run(() => geriGetir(p.id))} disabled={pending} className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-navy disabled:opacity-50 dark:bg-white/10 dark:text-white">
          Geri getir
        </button>
        <ErrorText>{error}</ErrorText>
      </span>
    </div>
  );
}
