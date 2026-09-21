"use client";

import { useState } from "react";
import { kabulEt, reddet } from "@/app/actions/video-oneri";
import { ErrorText } from "@/components/ui/ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";
import { smallButtonClasses } from "@/components/ui/Button";

type ModuleOpt = { id: string; ad: string; trackAd: string };
type Props = {
  id: string;
  youtubeId: string;
  baslik: string;
  kanal: string | null;
  izlenme: number | null;
  yayinTarihi: string | null;
  skor: number | null;
  // Kuyruğun sıralandığı bileşik skor: uygunluk + izlenme + tazelik.
  siralamaSkoru: number | null;
  gerekce: string | null;
  onerilenModuleId: string | null;
  modules: ModuleOpt[];
};

export function OneriKarti(p: Props) {
  const [moduleId, setModuleId] = useState(p.onerilenModuleId ?? p.modules[0]?.id ?? "");
  const { pending, error, run } = useServerAction("Hata");

  function accept() {
    run(() => kabulEt(p.id, moduleId));
  }
  function decline() {
    run(() => reddet(p.id));
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black/5">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${p.youtubeId}`}
          title={p.baslik}
          allowFullScreen
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-fg">{p.baslik}</h3>
          {p.siralamaSkoru === null ? null : (
            <span
              title="Sıralama skoru: uygunluk %75, izlenme %15, tazelik %10"
              className="shrink-0 rounded-md border border-navy/25 px-2.5 py-1 text-xs font-bold tabular-nums text-navy dark:border-accent/40 dark:text-accent"
            >
              {Math.round(p.siralamaSkoru)}
            </span>
          )}
        </div>
        <p className="text-sm text-fg-soft">
          {p.kanal ?? "Kanal yok"} · {(p.izlenme ?? 0).toLocaleString("tr-TR")} izlenme
          {p.yayinTarihi ? ` · ${new Date(p.yayinTarihi).toLocaleDateString("tr-TR")}` : ""}
        </p>
        <p className="text-sm text-fg">
          <span className="font-semibold">Uygunluk {p.skor ?? 0}/100.</span> {p.gerekce ?? ""}
        </p>
        <label className="text-sm text-fg-soft">
          Modül:
          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            className="ml-2 rounded-lg border border-[var(--line)] bg-transparent px-2 py-1 text-sm text-fg"
          >
            {p.modules.map((m) => (
              <option key={m.id} value={m.id}>{m.trackAd} · {m.ad}</option>
            ))}
          </select>
        </label>
        <div className="mt-1 flex gap-2">
          <button onClick={accept} disabled={pending || !moduleId} className={smallButtonClasses("success")}>
            Kabul et
          </button>
          <button onClick={decline} disabled={pending} className={smallButtonClasses("danger")}>
            Reddet
          </button>
        </div>
        <ErrorText>{error}</ErrorText>
      </div>
    </div>
  );
}
