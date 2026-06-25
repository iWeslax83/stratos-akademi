"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateEvent, deleteEvent } from "@/app/actions/events";

const inputCls =
  "w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("tr-TR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ISO → datetime-local input değeri ("YYYY-MM-DDTHH:mm", yerel saat).
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventItem({
  id,
  baslik,
  aciklama,
  baslangic,
  yer,
  gecmis = false,
}: {
  id: string;
  baslik: string;
  aciklama: string | null;
  baslangic: string;
  yer: string | null;
  gecmis?: boolean;
}) {
  const [edit, setEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const r = await updateEvent(fd);
      if (!r.ok) { setError(r.error ?? "Hata"); return; }
      setEdit(false);
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm(`"${baslik}" etkinliğini silmek istediğine emin misin?`)) return;
    start(async () => {
      const r = await deleteEvent(id);
      if (!r.ok) { window.alert(r.error ?? "Silinemedi"); return; }
      router.refresh();
    });
  }

  if (edit) {
    return (
      <form onSubmit={save} className="space-y-2 border-b border-[var(--line)] py-4 last:border-b-0">
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <input type="hidden" name="id" value={id} />
        <input name="baslik" required defaultValue={baslik} className={inputCls} />
        <div className="grid gap-2 sm:grid-cols-2">
          <input name="baslangic" type="datetime-local" required defaultValue={toLocalInput(baslangic)} className={inputCls} />
          <input name="yer" defaultValue={yer ?? ""} placeholder="Yer" className={inputCls} />
        </div>
        <textarea name="aciklama" rows={3} defaultValue={aciklama ?? ""} className={inputCls} />
        <div className="flex gap-2">
          <button disabled={pending} className="rounded-full bg-navy px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-navy">
            {pending ? "…" : "Kaydet"}
          </button>
          <button type="button" onClick={() => setEdit(false)} disabled={pending} className="rounded-full bg-black/5 px-4 py-1.5 text-xs font-semibold text-navy dark:bg-white/10 dark:text-white">
            Vazgeç
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="border-b border-[var(--line)] py-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className={gecmis ? "flex-1 opacity-60" : "flex-1"}>
          <div className="font-display font-bold text-navy dark:text-white">{baslik}</div>
          <div className="text-xs font-semibold text-gold">
            {formatDateTime(baslangic)}
            {yer && <span className="text-muted"> · {yer}</span>}
          </div>
          {aciklama && (
            <p className="mt-1 whitespace-pre-line text-sm text-[#46526b] dark:text-[#9fb0c9]">{aciklama}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => setEdit(true)} disabled={pending} className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-navy disabled:opacity-50 dark:bg-white/10 dark:text-white">
            Düzenle
          </button>
          <button onClick={remove} disabled={pending} className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-300">
            Sil
          </button>
        </div>
      </div>
    </div>
  );
}
