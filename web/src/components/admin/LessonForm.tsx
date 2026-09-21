"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { FormError } from "@/components/ui/FormError";
import { updateLesson, refreshLessonDuration } from "@/app/actions/admin-curriculum";
import { formatSure } from "@/lib/lessons/format";

type Lesson = {
  id: string;
  baslik: string;
  youtube_video_id: string;
  aciklama: string | null;
  sure_sn: number | null;
};

const INPUT =
  "w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-fg placeholder:text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

function Field({
  name, label, defaultValue, required = false, placeholder,
}: {
  name: string; label: string; defaultValue?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted">
        {label}{required && " *"}
      </span>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
        className={INPUT}
      />
    </label>
  );
}

// Yalnız düzenleme: yeni ders VideoEkle ile eklenir. Süre elle girilmez; video
// değişirse sunucu YouTube'dan yeniden alır, "YouTube'dan yenile" da aynısını yapar.
export function LessonForm({
  trackId, moduleId, editing,
}: {
  trackId: string; moduleId: string; editing: Lesson;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [yenileniyor, yenileStart] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const res = await updateLesson(fd);
      if (!res.ok) { setError(res.error ?? "Hata"); return; }
      router.push(`/admin/mufredat/${trackId}/${moduleId}`);
    });
  }

  function yenile() {
    setError(null);
    yenileStart(async () => {
      const res = await refreshLessonDuration(editing.id, trackId, moduleId);
      if (!res.ok) { setError(res.error ?? "Süre yenilenemedi."); return; }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="track_id" value={trackId} />
      <input type="hidden" name="module_id" value={moduleId} />
      <input type="hidden" name="id" value={editing.id} />
      <FormError box>{error}</FormError>
      <Field name="baslik" label="Başlık" defaultValue={editing.baslik} required />
      <Field
        name="youtube"
        label="YouTube (URL veya id)"
        defaultValue={editing.youtube_video_id}
        required
        placeholder="https://youtu.be/… veya dQw4w9WgXcQ"
      />
      <Field name="aciklama" label="Açıklama" defaultValue={editing.aciklama ?? ""} />
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-muted">Süre</span>
        <span className="text-sm font-semibold text-fg">{formatSure(editing.sure_sn)}</span>
        <Button type="button" variant="ghost" loading={yenileniyor} onClick={yenile}>
          YouTube&apos;dan yenile
        </Button>
      </div>
      <div className="flex gap-3">
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? "Kaydediliyor…" : "Güncelle"}
        </Button>
        <LinkButton href={`/admin/mufredat/${trackId}/${moduleId}`} variant="ghost">
          İptal
        </LinkButton>
      </div>
    </form>
  );
}
