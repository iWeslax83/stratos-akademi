"use client";

import { ErrorText } from "@/components/ui/ErrorText";
import { ChevronUpIcon, ChevronDownIcon } from "@/components/ui/icons";
import { moveLesson } from "@/app/actions/admin-curriculum";
import { useServerAction } from "@/lib/ui/useServerAction";

const BTN =
  "grid h-8 w-8 place-items-center rounded-md border border-[var(--line)] text-fg hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10";

export function SiraButonlari({
  id, trackId, baslik, ilk, son,
}: {
  id: string; trackId: string; baslik: string; ilk: boolean; son: boolean;
}) {
  const { pending, error, run } = useServerAction("Taşınamadı");
  return (
    <div>
      <div className="flex gap-1">
        <button
          type="button"
          aria-label={`Yukarı taşı: ${baslik}`}
          disabled={ilk || pending}
          onClick={() => run(() => moveLesson(id, "yukari", trackId))}
          className={BTN}
        >
          <ChevronUpIcon />
        </button>
        <button
          type="button"
          aria-label={`Aşağı taşı: ${baslik}`}
          disabled={son || pending}
          onClick={() => run(() => moveLesson(id, "asagi", trackId))}
          className={BTN}
        >
          <ChevronDownIcon />
        </button>
      </div>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
