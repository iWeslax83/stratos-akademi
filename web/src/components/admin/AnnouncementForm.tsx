"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createAnnouncement } from "@/app/actions/announcements";

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
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <input
        name="baslik"
        required
        placeholder="Başlık (ör. Salı sprint toplantısı)"
        className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm font-semibold text-navy outline-none placeholder:text-muted/60 focus:border-gold dark:text-white"
      />
      <textarea
        name="icerik"
        required
        rows={4}
        placeholder="Duyuru metni…"
        className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-gold dark:text-white"
      />
      <Button variant="gold" disabled={pending}>{pending ? "Yayınlanıyor…" : "Yayınla"}</Button>
    </form>
  );
}
