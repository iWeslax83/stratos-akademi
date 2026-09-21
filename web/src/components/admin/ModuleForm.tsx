"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { FormError } from "@/components/ui/FormError";
import { createModule, updateModule } from "@/app/actions/admin-curriculum";

type Module = { id: string; ad: string; aciklama: string | null; sira: number };

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
        autoComplete="off"
        className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
    </label>
  );
}

export function ModuleForm({ trackId, editing }: { trackId: string; editing: Module | null }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    start(async () => {
      const res = editing ? await updateModule(fd) : await createModule(fd);
      if (!res.ok) { setError(res.error ?? "Hata"); return; }
      if (editing) router.push(`/admin/mufredat/${trackId}`);
      else { form.reset(); router.refresh(); }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="track_id" value={trackId} />
      {editing && <input type="hidden" name="id" value={editing.id} />}
      <FormError box>{error}</FormError>
      <Field name="ad" label="Ad" defaultValue={editing?.ad} required />
      <Field name="aciklama" label="Açıklama" defaultValue={editing?.aciklama ?? ""} />
      <Field name="sira" label="Sıra" type="number" defaultValue={String(editing?.sira ?? 0)} />
      <div className="flex gap-3">
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? "Kaydediliyor…" : editing ? "Güncelle" : "Ekle"}
        </Button>
        {editing && (
          <LinkButton href={`/admin/mufredat/${trackId}`} variant="ghost">
            İptal
          </LinkButton>
        )}
      </div>
    </form>
  );
}
