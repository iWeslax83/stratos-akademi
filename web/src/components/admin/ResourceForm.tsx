"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createResource } from "@/app/actions/resources";
import { KATEGORILER } from "@/lib/resources/group";

const inputCls =
  "w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-gold dark:text-white";

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
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <input name="baslik" required placeholder="Başlık (ör. F450 çerçeve datasheet)" className={inputCls} />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input name="url" type="url" required placeholder="https://…" className={inputCls} />
        <select name="kategori" defaultValue="Genel" className={inputCls}>
          {KATEGORILER.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>
      <textarea name="aciklama" rows={2} placeholder="Açıklama (opsiyonel)…" className={inputCls} />
      <Button variant="gold" disabled={pending}>{pending ? "Ekleniyor…" : "Ekle"}</Button>
    </form>
  );
}
