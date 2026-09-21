"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { createClient } from "@/lib/supabase/client";
import { submitTask } from "@/app/actions/tasks";
import { canEditSubmission, submissionStatusLabel, type SubmissionStatus } from "@/lib/tasks/status";
import { validateFile, uploadPath } from "@/lib/tasks/upload";

export function SubmissionForm({
  taskId,
  userId,
  submission,
  dosyaUrl,
}: {
  taskId: string;
  // Storage yolu prefix'i için (RLS zaten auth.uid()'ye zorlar); güvenlik kararı sunucuda.
  userId: string;
  submission: {
    icerik: string;
    durum: SubmissionStatus;
    geri_bildirim: string | null;
    dosya_yolu: string | null;
  } | null;
  dosyaUrl: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const durum = submission?.durum ?? null;
  const editable = canEditSubmission(durum);
  const busy = pending || yukleniyor;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const icerik = ((fd.get("icerik") as string | null) ?? "").trim();
    setError(null);
    start(async () => {
      let dosyaYolu = submission?.dosya_yolu ?? null;
      if (file) {
        const v = validateFile({ type: file.type, size: file.size });
        if (v) { setError(v); return; }
        const path = uploadPath(userId, taskId, file.name, Date.now());
        const sb = createClient();
        setYukleniyor(true);
        const { error: upErr } = await sb.storage.from("gorev-dosyalari").upload(path, file, { upsert: false });
        setYukleniyor(false);
        if (upErr) { setError("Dosya yüklenemedi: " + upErr.message); return; }
        dosyaYolu = path;
      }
      if (!icerik && !dosyaYolu) { setError("Link/metin veya dosya gerekli."); return; }
      const r = await submitTask(taskId, icerik, dosyaYolu);
      if (!r.ok) { setError(r.error ?? "Hata"); return; }
      router.refresh();
    });
  }

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
        <span className="text-muted">Durum:</span>
        <span
          className={
            durum === "onay"
              ? "text-success-fg"
              : durum === "red"
                ? "text-danger-fg"
                : "text-muted"
          }
        >
          {submissionStatusLabel(durum)}
        </span>
      </div>

      {submission?.geri_bildirim && (
        <p className="mb-2 rounded-core bg-black/[0.04] p-3 text-sm text-fg dark:bg-white/[0.04]">
          <span className="font-semibold">Geri bildirim:</span> {submission.geri_bildirim}
        </p>
      )}

      {submission?.dosya_yolu && dosyaUrl && (
        <a
          href={dosyaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 inline-block text-sm font-semibold text-accent-fg underline"
        >
          Yüklenen dosyayı aç
        </a>
      )}

      {editable ? (
        <form onSubmit={onSubmit} className="space-y-2">
          <FormError>{error}</FormError>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">Gönderi (link veya açıklama)</span>
            <textarea
              name="icerik"
              defaultValue={submission?.icerik ?? ""}
              rows={3}
              placeholder="Drive/video linki veya kısa açıklama…"
              className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">Dosya (JPG, PNG, WEBP, PDF, en fazla 5 MB)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-black/5 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-navy dark:file:bg-white/10 dark:file:text-white"
            />
          </label>
          <Button type="submit" variant="accent" disabled={busy}>
            {yukleniyor ? "Dosya yükleniyor…" : pending ? "Gönderiliyor…" : "Gönder"}
          </Button>
        </form>
      ) : (
        <p className="rounded-core border border-[var(--line)] p-3 text-sm text-muted">
          {submission?.icerik}
        </p>
      )}
    </div>
  );
}
