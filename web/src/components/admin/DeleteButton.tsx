"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function DeleteButton({
  onDelete,
  uyari,
}: {
  onDelete: () => Promise<{ ok: boolean; error?: string }>;
  uyari: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function click() {
    if (!window.confirm(uyari)) return;
    start(async () => {
      const r = await onDelete();
      if (!r.ok) window.alert(r.error ?? "Silinemedi");
      else router.refresh();
    });
  }

  return (
    <button
      onClick={click}
      disabled={pending}
      className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-300"
    >
      {pending ? "…" : "Sil"}
    </button>
  );
}
