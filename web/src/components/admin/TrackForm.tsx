"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { createTrack, updateTrack } from "@/app/actions/admin-curriculum";

type Track = {
  id: string;
  slug: string;
  ad: string;
  aciklama: string | null;
  ikon: string | null;
  sira: number;
};

function Field({
  name, label, defaultValue, type = "text", required = false,
}: {
  name: string; label: string; defaultValue?: string; type?: string; required?: boolean;
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
        className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
      />
    </label>
  );
}

export function TrackForm({ editing }: { editing: Track | null }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    start(async () => {
      const res = editing ? await updateTrack(fd) : await createTrack(fd);
      if (!res.ok) { setError(res.error ?? "Hata"); return; }
      if (editing) router.push("/admin/mufredat");
      else { form.reset(); router.refresh(); }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {editing && <input type="hidden" name="id" value={editing.id} />}
      {error && (
        <div className="rounded-core bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      <Field name="ad" label="Ad" defaultValue={editing?.ad} required />
      <Field name="slug" label="Slug" defaultValue={editing?.slug} required />
      <Field name="aciklama" label="Açıklama" defaultValue={editing?.aciklama ?? ""} />
      <Field name="ikon" label="İkon (emoji)" defaultValue={editing?.ikon ?? ""} />
      <Field name="sira" label="Sıra" type="number" defaultValue={String(editing?.sira ?? 0)} />
      <div className="flex gap-3">
        <Button variant="gold" disabled={pending}>
          {pending ? "Kaydediliyor…" : editing ? "Güncelle" : "Ekle"}
        </Button>
        {editing && (
          <Link href="/admin/mufredat">
            <Button variant="ghost" type="button">İptal</Button>
          </Link>
        )}
      </div>
    </form>
  );
}
