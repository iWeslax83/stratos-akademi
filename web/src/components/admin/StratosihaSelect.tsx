"use client";

import { linkStratosiha } from "@/app/actions/admin-members";
import { ErrorText } from "@/components/ui/ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";

export function StratosihaSelect({
  userId,
  stratosihaAd,
  names,
  selfId,
}: {
  userId: string;
  stratosihaAd: string | null;
  names: string[];
  selfId: string;
}) {
  const { pending, error, run } = useServerAction("Eşleştirme güncellenemedi");
  const isSelf = userId === selfId;

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    run(() => linkStratosiha(userId, v === "" ? null : v, selfId));
  }

  return (
    <span>
      <select
        value={stratosihaAd ?? ""}
        onChange={onChange}
        disabled={pending || isSelf}
        className="rounded-lg border border-[var(--line)] bg-transparent px-2.5 py-1.5 text-sm font-semibold text-navy outline-none focus:border-accent disabled:opacity-60 dark:text-white"
      >
        <option value="">Eşleşme yok</option>
        {names.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}
