"use client";

import { useState } from "react";
import { reviewSubmission } from "@/app/actions/tasks";
import { ErrorText } from "@/components/ui/ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";
import { smallButtonClasses } from "@/components/ui/Button";

export function ReviewControls({ submissionId }: { submissionId: string }) {
  const [redMode, setRedMode] = useState(false);
  const [not, setNot] = useState("");
  const { pending, error, run } = useServerAction("Hata");

  function approve() {
    run(() => reviewSubmission(submissionId, "onay", ""));
  }
  function reject() {
    run(() => reviewSubmission(submissionId, "red", not));
  }

  if (redMode) {
    return (
      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <label className="min-w-[200px] flex-1">
            <span className="sr-only">Reddetme nedeni</span>
            <textarea
              value={not}
              onChange={(e) => setNot(e.target.value)}
              rows={2}
              autoFocus
              placeholder="Reddetme nedeni…"
              className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>
          <div className="flex gap-2">
            <button onClick={reject} disabled={pending} className={smallButtonClasses("dangerSolid")}>
              Reddet
            </button>
            <button onClick={() => setRedMode(false)} disabled={pending} className={smallButtonClasses("ghost")}>
              Vazgeç
            </button>
          </div>
        </div>
        <ErrorText>{error}</ErrorText>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <button onClick={approve} disabled={pending} className={smallButtonClasses("success")}>
          Onayla
        </button>
        <button onClick={() => setRedMode(true)} disabled={pending} className={smallButtonClasses("danger")}>
          Reddet
        </button>
      </div>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
