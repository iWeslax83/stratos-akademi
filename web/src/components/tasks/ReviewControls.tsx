"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewSubmission } from "@/app/actions/tasks";

export function ReviewControls({ submissionId, adminId }: { submissionId: string; adminId: string }) {
  const [pending, start] = useTransition();
  const [redMode, setRedMode] = useState(false);
  const [not, setNot] = useState("");
  const router = useRouter();

  function approve() {
    start(async () => {
      const r = await reviewSubmission(submissionId, "onay", "", adminId);
      if (!r.ok) window.alert(r.error ?? "Hata");
      else router.refresh();
    });
  }
  function reject() {
    start(async () => {
      const r = await reviewSubmission(submissionId, "red", not, adminId);
      if (!r.ok) { window.alert(r.error ?? "Hata"); return; }
      router.refresh();
    });
  }

  if (redMode) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <textarea
          value={not}
          onChange={(e) => setNot(e.target.value)}
          rows={2}
          placeholder="Reddetme nedeni…"
          className="min-w-[200px] flex-1 rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
        />
        <div className="flex gap-2">
          <button onClick={reject} disabled={pending} className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
            Reddet
          </button>
          <button onClick={() => setRedMode(false)} disabled={pending} className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-navy dark:bg-white/10 dark:text-white">
            Vazgeç
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button onClick={approve} disabled={pending} className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
        Onayla
      </button>
      <button onClick={() => setRedMode(true)} disabled={pending} className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
        Reddet
      </button>
    </div>
  );
}
