"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
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
  const [pending, start] = useTransition();
  const router = useRouter();
  const durum = submission?.durum ?? null;
  const editable = canEditSubmission(durum);

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
        const { error: upErr } = await sb.storage.from("gorev-dosyalari").upload(path, file, { upsert: false });
        if (upErr) { setError("Dosya yüklenemedi: " + upErr.message); return; }
        dosyaYolu = path;
      }
      if (!icerik && !dosyaYolu) { setError("Link/metin veya dosya gerekli."); return; }
      const r = await submitTask(taskId, icerik, userId, dosyaYolu);
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
              ? "text-green-700 dark:text-green-400"
              : durum === "red"
                ? "text-red-600"
                : "text-muted"
          }
        >
          {submissionStatusLabel(durum)}
        </span>
      </div>

      {submission?.geri_bildirim && (
        <p className="mb-2 rounded-core bg-black/[0.04] p-3 text-sm text-navy dark:bg-white/[0.04] dark:text-white">
          <span className="font-semibold">Geri bildirim:</span> {submission.geri_bildirim}
        </p>
      )}

      {submission?.dosya_yolu && dosyaUrl && (
        <a
          href={dosyaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 inline-block text-sm font-semibold text-accent-ink dark:text-accent underline"
        >
          Yüklenen dosya →
        </a>
      )}

      {editable ? (
        <form onSubmit={onSubmit} className="space-y-2">
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <textarea
            name="icerik"
            defaultValue={submission?.icerik ?? ""}
            rows={3}
            placeholder="Link (Drive/video) veya açıklama yaz…"
            className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-accent dark:text-white"
          />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-black/5 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-navy dark:file:bg-white/10 dark:file:text-white"
          />
          <Button variant="accent" disabled={pending}>{pending ? "Gönderiliyor…" : "Gönder"}</Button>
        </form>
      ) : (
        <p className="rounded-core border border-[var(--line)] p-3 text-sm text-muted">
          {submission?.icerik}
        </p>
      )}
    </div>
  );
}
