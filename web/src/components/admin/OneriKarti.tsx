"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { kabulEt, reddet } from "@/app/actions/video-oneri";

type ModuleOpt = { id: string; ad: string; trackAd: string };
type Props = {
  id: string;
  youtubeId: string;
  baslik: string;
  kanal: string | null;
  izlenme: number | null;
  yayinTarihi: string | null;
  skor: number | null;
  gerekce: string | null;
  onerilenModuleId: string | null;
  modules: ModuleOpt[];
};

export function OneriKarti(p: Props) {
  const [pending, start] = useTransition();
  const [moduleId, setModuleId] = useState(p.onerilenModuleId ?? p.modules[0]?.id ?? "");
  const router = useRouter();

  function accept() {
    start(async () => {
      const r = await kabulEt(p.id, moduleId);
      if (!r.ok) { window.alert(r.error ?? "Hata"); return; }
      router.refresh();
    });
  }
  function decline() {
    start(async () => {
      const r = await reddet(p.id);
      if (!r.ok) { window.alert(r.error ?? "Hata"); return; }
      router.refresh();
    });
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
        <h3 className="font-display text-lg font-semibold text-navy dark:text-white">{p.baslik}</h3>
        <p className="text-sm text-navy/70 dark:text-white/70">
          {p.kanal ?? "—"} · {(p.izlenme ?? 0).toLocaleString("tr-TR")} izlenme
          {p.yayinTarihi ? ` · ${new Date(p.yayinTarihi).toLocaleDateString("tr-TR")}` : ""}
        </p>
        <p className="text-sm text-navy dark:text-white">
          <span className="font-semibold">Uygunluk {p.skor ?? 0}/100.</span> {p.gerekce ?? ""}
        </p>
        <label className="text-sm text-navy/70 dark:text-white/70">
          Modül:
          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            className="ml-2 rounded-lg border border-[var(--line)] bg-transparent px-2 py-1 text-sm text-navy dark:text-white"
          >
            {p.modules.map((m) => (
              <option key={m.id} value={m.id}>{m.trackAd} · {m.ad}</option>
            ))}
          </select>
        </label>
        <div className="mt-1 flex gap-2">
          <button onClick={accept} disabled={pending || !moduleId} className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
            Kabul et
          </button>
          <button onClick={decline} disabled={pending} className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
            Reddet
          </button>
        </div>
      </div>
    </div>
  );
}
