"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createTask, updateTask } from "@/app/actions/tasks";

type Task = { id: string; baslik: string; aciklama: string | null; sira: number };

export function TaskForm({
  trackId,
  moduleId,
  editing,
}: {
  trackId: string;
  moduleId: string;
  editing: Task | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    start(async () => {
      const res = editing ? await updateTask(fd) : await createTask(fd);
      if (!res.ok) { setError(res.error ?? "Hata"); return; }
      if (editing) router.push(`/admin/mufredat/${trackId}/${moduleId}/gorevler`);
      else { form.reset(); router.refresh(); }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="module_id" value={moduleId} />
      {editing && <input type="hidden" name="id" value={editing.id} />}
      {error && (
        <div className="rounded-core bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Başlık *</span>
        <input
          name="baslik"
          defaultValue={editing?.baslik}
          required
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Açıklama</span>
        <textarea
          name="aciklama"
          defaultValue={editing?.aciklama ?? ""}
          rows={3}
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
        />
      </label>
      <label className="block w-32">
        <span className="mb-1 block text-xs font-semibold text-muted">Sıra</span>
        <input
          name="sira"
          type="number"
          defaultValue={String(editing?.sira ?? 0)}
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
        />
      </label>
      <Button variant="gold" disabled={pending}>{pending ? "…" : editing ? "Güncelle" : "Ekle"}</Button>
    </form>
  );
}
