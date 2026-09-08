"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { createAnnouncement } from "@/app/actions/announcements";

const inputCls =
  "w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-accent dark:text-white";

// Yeni duyuru oluşturma formu (admin).
export function AnnouncementForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    start(async () => {
      const r = await createAnnouncement(fd);
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
        <input name="baslik" required autoComplete="off" placeholder="ör. Salı sprint toplantısı" className={`${inputCls} font-semibold`} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Duyuru metni *</span>
        <textarea name="icerik" required rows={4} placeholder="Detaylar…" className={inputCls} />
      </label>
      <Button type="submit" variant="accent" disabled={pending}>{pending ? "Yayınlanıyor…" : "Yayınla"}</Button>
    </form>
  );
}
