"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { updateQuizMeta } from "@/app/actions/admin-quiz";

export function QuizMetaForm({
  quiz,
}: {
  quiz: { id: string; baslik: string; gecme_esigi: number };
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const r = await updateQuizMeta(fd);
      if (!r.ok) { setError(r.error ?? "Hata"); return; }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={quiz.id} />
      <label className="block min-w-[200px] flex-1">
        <span className="mb-1 block text-xs font-semibold text-muted">Başlık</span>
        <input
          name="baslik"
          defaultValue={quiz.baslik}
          required
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-accent dark:text-white"
        />
      </label>
      <label className="block w-32">
        <span className="mb-1 block text-xs font-semibold text-muted">Geçme eşiği (%)</span>
        <input
          name="gecme_esigi"
          type="number"
          min={0}
          max={100}
          defaultValue={String(quiz.gecme_esigi)}
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-accent dark:text-white"
        />
      </label>
      <Button variant="accent" disabled={pending}>{pending ? "…" : "Kaydet"}</Button>
      {error && <p className="w-full text-sm font-semibold text-red-600">{error}</p>}
    </form>
  );
}
