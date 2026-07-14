"use client";

import { ErrorText } from "@/components/ui/ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";

export function DeleteButton({
  onDelete,
  uyari,
}: {
  onDelete: () => Promise<{ ok: boolean; error?: string }>;
  uyari: string;
}) {
  const { pending, error, run } = useServerAction("Silinemedi");

  function click() {
    if (!window.confirm(uyari)) return;
    run(onDelete);
  }

  return (
    <span>
      <button
        onClick={click}
        disabled={pending}
        className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
      >
        {pending ? "…" : "Sil"}
      </button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}
