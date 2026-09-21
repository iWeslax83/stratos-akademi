"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { createResource } from "@/app/actions/resources";
import { KATEGORILER } from "@/lib/resources/group";

const inputCls =
  "w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-fg focus-visible:outline-none placeholder:text-muted/60 focus-visible:ring-2 focus-visible:ring-accent";
// Native <select>: color-scheme (globals.css) açılır listeyi temaya uydurur; option'lara
// da açık bir zemin ver ki eski tarayıcılarda beyaz-üstü-beyaz olmasın.
const selectCls = inputCls + " [&>option]:bg-[var(--panel)] [&>option]:text-navy dark:[&>option]:text-white";

// Yeni kaynak ekleme formu (admin).
export function ResourceForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    start(async () => {
      const r = await createResource(fd);
      if (!r.ok) { setError(r.error ?? "Hata"); return; }
      form.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <FormError>{error}</FormError>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Başlık *</span>
        <input name="baslik" required autoComplete="off" placeholder="ör. F450 çerçeve datasheet" className={inputCls} />
      </label>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Bağlantı *</span>
          <input name="url" type="url" inputMode="url" required autoComplete="off" placeholder="https://…" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Kategori</span>
          <select name="kategori" defaultValue="Genel" className={selectCls}>
            {KATEGORILER.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Açıklama (opsiyonel)</span>
        <textarea name="aciklama" rows={2} placeholder="Kısa not…" className={inputCls} />
      </label>
      <Button type="submit" variant="accent" disabled={pending}>{pending ? "Ekleniyor…" : "Ekle"}</Button>
    </form>
  );
}
