"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateResource, deleteResource } from "@/app/actions/resources";
import { KATEGORILER } from "@/lib/resources/group";

const inputCls =
  "w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white";

export function ResourceItem({
  id,
  baslik,
  url,
  kategori,
  aciklama,
}: {
  id: string;
  baslik: string;
  url: string;
  kategori: string;
  aciklama: string | null;
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
      const r = await updateResource(fd);
      if (!r.ok) { setError(r.error ?? "Hata"); return; }
      setEdit(false);
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm(`"${baslik}" kaynağını silmek istediğine emin misin?`)) return;
    start(async () => {
      const r = await deleteResource(id);
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
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input name="url" type="url" required defaultValue={url} className={inputCls} />
          <select name="kategori" defaultValue={kategori} className={inputCls}>
            {KATEGORILER.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <textarea name="aciklama" rows={2} defaultValue={aciklama ?? ""} className={inputCls} />
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
    <div className="border-b border-[var(--line)] py-3 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <a href={url} target="_blank" rel="noopener noreferrer" className="break-words font-semibold text-navy underline decoration-gold underline-offset-2 hover:text-gold-ink dark:hover:text-gold dark:text-white">
            {baslik}
          </a>
          {aciklama && <p className="mt-0.5 text-sm text-muted">{aciklama}</p>}
          <div className="mt-0.5 truncate text-xs text-muted">{url}</div>
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
