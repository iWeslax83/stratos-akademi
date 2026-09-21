"use client";

import { geriGetir } from "@/app/actions/video-oneri";
import { ErrorText } from "@/components/ui/ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";
import { smallButtonClasses } from "@/components/ui/Button";

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
          className="font-medium text-fg underline-offset-2 hover:underline"
        >
          {p.baslik}
        </a>
        <p className="text-xs text-fg-soft">
          {p.rejectedAt ? `Reddedildi: ${new Date(p.rejectedAt).toLocaleDateString("tr-TR")}` : ""}
        </p>
      </div>
      <span>
        <button onClick={() => run(() => geriGetir(p.id))} disabled={pending} className={smallButtonClasses("ghost")}>
          Geri getir
        </button>
        <ErrorText>{error}</ErrorText>
      </span>
    </div>
  );
}
