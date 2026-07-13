"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createEvent } from "@/app/actions/events";

const inputCls =
  "w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-accent dark:text-white";

// Yeni etkinlik oluşturma formu (admin).
export function EventForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    start(async () => {
      const r = await createEvent(fd);
      if (!r.ok) { setError(r.error ?? "Hata"); return; }
      form.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <input name="baslik" required placeholder="Başlık (ör. Sprint toplantısı)" className={inputCls} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Tarih / saat</span>
          <input name="baslangic" type="datetime-local" required className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Yer (opsiyonel)</span>
          <input name="yer" placeholder="Atölye / online…" className={inputCls} />
        </label>
      </div>
      <textarea name="aciklama" rows={3} placeholder="Açıklama (opsiyonel)…" className={inputCls} />
      <Button variant="accent" disabled={pending}>{pending ? "Ekleniyor…" : "Ekle"}</Button>
    </form>
  );
}
