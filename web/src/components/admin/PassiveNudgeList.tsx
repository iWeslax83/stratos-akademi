"use client";

import { useState } from "react";
import { sendPassiveNudgeAll } from "@/app/actions/notifications";
import { ErrorText } from "@/components/ui/ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";
import { PassiveNudgeButton } from "@/components/admin/PassiveNudgeButton";

type Pasif = { id: string; ad: string; gun: number | null };

export function PassiveNudgeList({ uyeler }: { uyeler: Pasif[] }) {
  const [sent, setSent] = useState<Set<string>>(new Set());
  const { pending, error, run } = useServerAction("Bildirimler gönderilemedi");

  const bekleyen = uyeler.filter((u) => !sent.has(u.id));

  function markSent(ids: string[]) {
    setSent((prev) => new Set([...prev, ...ids]));
  }

  function onSendAll() {
    const ids = bekleyen.map((u) => u.id);
    run(() => sendPassiveNudgeAll(ids), () => markSent(ids));
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSendAll}
          disabled={pending || bekleyen.length === 0}
          className="rounded-lg border border-accent px-3 py-1.5 text-xs font-semibold text-fg hover:bg-accent-wash disabled:opacity-60"
        >
          {bekleyen.length === 0
            ? "Hepsine gönderildi"
            : pending
              ? "Gönderiliyor…"
              : `Bütün pasif üyeleri dürt (${bekleyen.length})`}
        </button>
        <ErrorText>{error}</ErrorText>
      </div>
      <div className="flex flex-col gap-2">
        {uyeler.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-3">
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-accent-ink/25 bg-accent-wash px-3 py-1.5 text-xs font-semibold text-accent-fg dark:border-accent/25">
              <span className="truncate">{u.ad}</span>
              <span className="shrink-0">· {u.gun === null ? "hiç" : `${u.gun} gün`}</span>
            </span>
            <PassiveNudgeButton userId={u.id} sent={sent.has(u.id)} onSent={(id) => markSent([id])} />
          </div>
        ))}
      </div>
    </>
  );
}
