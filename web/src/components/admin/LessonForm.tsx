"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createLesson, updateLesson } from "@/app/actions/admin-curriculum";

type Lesson = {
  id: string;
  baslik: string;
  youtube_video_id: string;
  aciklama: string | null;
  sure_sn: number | null;
  sira: number;
};

function Field({
  name, label, defaultValue, type = "text", required = false, placeholder,
}: {
  name: string; label: string; defaultValue?: string; type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted">
        {label}{required && " *"}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-gold dark:text-white"
      />
    </label>
  );
}

export function LessonForm({
  trackId, moduleId, editing,
}: {
  trackId: string; moduleId: string; editing: Lesson | null;
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
      const res = editing ? await updateLesson(fd) : await createLesson(fd);
      if (!res.ok) { setError(res.error ?? "Hata"); return; }
      if (editing) router.push(`/admin/mufredat/${trackId}/${moduleId}`);
      else { form.reset(); router.refresh(); }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="track_id" value={trackId} />
      <input type="hidden" name="module_id" value={moduleId} />
      {editing && <input type="hidden" name="id" value={editing.id} />}
      {error && (
        <div className="rounded-core bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      <Field name="baslik" label="Başlık" defaultValue={editing?.baslik} required />
      <Field
        name="youtube"
        label="YouTube (URL veya id)"
        defaultValue={editing?.youtube_video_id ?? ""}
        required
        placeholder="https://youtu.be/... veya dQw4w9WgXcQ"
      />
      <Field name="aciklama" label="Açıklama" defaultValue={editing?.aciklama ?? ""} />
      <Field name="sure_sn" label="Süre (saniye)" type="number" defaultValue={editing?.sure_sn != null ? String(editing.sure_sn) : ""} />
      <Field name="sira" label="Sıra" type="number" defaultValue={String(editing?.sira ?? 0)} />
      <div className="flex gap-3">
        <Button variant="gold" disabled={pending}>
          {pending ? "Kaydediliyor…" : editing ? "Güncelle" : "Ekle"}
        </Button>
        {editing && (
          <a href={`/admin/mufredat/${trackId}/${moduleId}`}>
            <Button variant="ghost" type="button">İptal</Button>
          </a>
        )}
      </div>
    </form>
  );
}
