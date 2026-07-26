"use client";

import { sendPassiveNudge } from "@/app/actions/notifications";
import { ErrorText } from "@/components/ui/ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";

export function PassiveNudgeButton({ userId }: { userId: string }) {
  const { pending, error, run } = useServerAction("Bildirim gönderilemedi");

  return (
    <span>
      <button
        type="button"
        onClick={() => run(() => sendPassiveNudge(userId))}
        disabled={pending}
        className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs font-semibold text-navy hover:border-accent disabled:opacity-60 dark:text-white"
      >
        Dürtme gönder
      </button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}
