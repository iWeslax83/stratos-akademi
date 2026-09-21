"use client";

import { useState } from "react";
import { updateAnnouncement, deleteAnnouncement } from "@/app/actions/announcements";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { ErrorText } from "@/components/ui/ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";
import { smallButtonClasses } from "@/components/ui/Button";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("tr-TR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Admin listesinde tek duyuru: görüntüle / düzenle / sil.
export function AnnouncementItem({
  id,
  baslik,
  icerik,
  createdAt,
}: {
  id: string;
  baslik: string;
  icerik: string;
  createdAt: string;
}) {
  const [edit, setEdit] = useState(false);
  const { pending, error, run } = useServerAction("Hata");

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    run(() => updateAnnouncement(fd), () => setEdit(false));
  }

  if (edit) {
    return (
      <form onSubmit={save} className="space-y-2 border-b border-[var(--line)] py-4 last:border-b-0">
        <ErrorText>{error}</ErrorText>
        <input type="hidden" name="id" value={id} />
        <input
          name="baslik"
          required
          defaultValue={baslik}
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm font-semibold text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <textarea
          name="icerik"
          required
          rows={4}
          defaultValue={icerik}
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <div className="flex gap-2">
          <button disabled={pending} className={smallButtonClasses("primary")}>
            {pending ? "…" : "Kaydet"}
          </button>
          <button type="button" onClick={() => setEdit(false)} disabled={pending} className={smallButtonClasses("ghost")}>
            Vazgeç
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="border-b border-[var(--line)] py-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="break-words font-display font-bold text-fg">{baslik}</div>
          <div className="text-xs text-muted">{formatDate(createdAt)}</div>
          <p className="mt-1 whitespace-pre-line text-sm text-fg-soft">{icerik}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => setEdit(true)} disabled={pending} className={smallButtonClasses("ghost")}>
            Düzenle
          </button>
          <ConfirmButton
            onConfirm={() => deleteAnnouncement(id)}
            soru={`"${baslik}" duyurusu silinsin mi?`}
          />
        </div>
      </div>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
