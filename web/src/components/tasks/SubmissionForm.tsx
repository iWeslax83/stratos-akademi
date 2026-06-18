"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { submitTask } from "@/app/actions/tasks";
import { canEditSubmission, submissionStatusLabel, type SubmissionStatus } from "@/lib/tasks/status";

export function SubmissionForm({
  taskId,
  userId,
  submission,
}: {
  taskId: string;
  userId: string;
  submission: { icerik: string; durum: SubmissionStatus; geri_bildirim: string | null } | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const durum = submission?.durum ?? null;
  const editable = canEditSubmission(durum);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const icerik = (fd.get("icerik") as string | null) ?? "";
    setError(null);
    start(async () => {
      const r = await submitTask(taskId, icerik, userId);
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

      {editable ? (
        <form onSubmit={onSubmit} className="space-y-2">
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <textarea
            name="icerik"
            defaultValue={submission?.icerik ?? ""}
            required
            rows={3}
            placeholder="Link (Drive/video) veya açıklama yaz…"
            className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
          />
          <Button variant="gold" disabled={pending}>{pending ? "…" : "Gönder"}</Button>
        </form>
      ) : (
        <p className="rounded-core border border-[var(--line)] p-3 text-sm text-muted">
          {submission?.icerik}
        </p>
      )}
    </div>
  );
}
