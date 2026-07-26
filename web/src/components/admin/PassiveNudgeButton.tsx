"use client";

import { useState } from "react";
import { sendPassiveNudge } from "@/app/actions/notifications";
import { ErrorText } from "@/components/ui/ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";

export function PassiveNudgeButton({ userId }: { userId: string }) {
  const [sent, setSent] = useState(false);
  const { pending, error, run } = useServerAction("Bildirim gönderilemedi");

  function onClick() {
    run(() => sendPassiveNudge(userId), () => setSent(true));
  }

  return (
    <span>
      <button
        type="button"
        onClick={onClick}
        disabled={pending || sent}
        className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs font-semibold text-navy hover:border-accent disabled:opacity-60 dark:text-white"
      >
        {sent ? "Gönderildi" : pending ? "Gönderiliyor…" : "Dürtme gönder"}
      </button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}
