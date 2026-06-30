"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAnnouncement, deleteAnnouncement } from "@/app/actions/announcements";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("tr-TR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Admin listesinde tek duyuru: görüntüle / düzenle / sil.
export function AnnouncementItem({
  id,
  baslik,
  icerik,
  createdAt,
}: {
  id: string;
  baslik: string;
  icerik: string;
  createdAt: string;
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
      const r = await updateAnnouncement(fd);
      if (!r.ok) { setError(r.error ?? "Hata"); return; }
      setEdit(false);
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm(`"${baslik}" duyurusunu silmek istediğine emin misin?`)) return;
    start(async () => {
      const r = await deleteAnnouncement(id);
      if (!r.ok) { window.alert(r.error ?? "Silinemedi"); return; }
      router.refresh();
    });
  }

  if (edit) {
    return (
      <form onSubmit={save} className="space-y-2 border-b border-[var(--line)] py-4 last:border-b-0">
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <input type="hidden" name="id" value={id} />
        <input
          name="baslik"
          required
          defaultValue={baslik}
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm font-semibold text-navy outline-none focus:border-gold dark:text-white"
        />
        <textarea
          name="icerik"
          required
          rows={4}
          defaultValue={icerik}
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
        />
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
        <div className="min-w-0 flex-1">
          <div className="break-words font-display font-bold text-navy dark:text-white">{baslik}</div>
          <div className="text-xs text-muted">{formatDate(createdAt)}</div>
          <p className="mt-1 whitespace-pre-line text-sm text-[#46526b] dark:text-[#9fb0c9]">{icerik}</p>
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
