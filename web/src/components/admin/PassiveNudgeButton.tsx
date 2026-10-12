"use client";

import { sendPassiveNudge } from "@/app/actions/notifications";
import { ErrorText } from "@/components/ui/ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";

export function PassiveNudgeButton({
  userId,
  sent,
  onSent,
}: {
  userId: string;
  sent: boolean;
  onSent: (userId: string) => void;
}) {
  const { pending, error, run } = useServerAction("Bildirim gönderilemedi");

  function onClick() {
    run(() => sendPassiveNudge(userId), () => onSent(userId));
  }

  return (
    <span>
      <button
        type="button"
        onClick={onClick}
        disabled={pending || sent}
        className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs font-semibold text-fg hover:border-accent disabled:opacity-60"
      >
        {sent ? "Gönderildi" : pending ? "Gönderiliyor…" : "Dürtme gönder"}
      </button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}
