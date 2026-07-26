"use client";

import { useState } from "react";
import { renameMember } from "@/app/actions/admin-members";
import { ErrorText } from "@/components/ui/ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";

export function NameEditor({
  userId,
  ad,
  selfId,
}: {
  userId: string;
  ad: string | null;
  selfId: string;
}) {
  const [value, setValue] = useState(ad ?? "");
  const { pending, error, run } = useServerAction("Ad güncellenemedi");
  const isSelf = userId === selfId;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    run(() => renameMember(userId, value, selfId));
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-1.5">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={pending || isSelf}
        placeholder="Ad Soyad"
        className="w-36 rounded-lg border border-[var(--line)] bg-transparent px-2.5 py-1.5 text-sm text-navy outline-none focus:border-accent disabled:opacity-60 dark:text-white"
      />
      <button
        type="submit"
        disabled={pending || isSelf}
        className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-sm font-semibold text-navy hover:border-accent disabled:opacity-60 dark:text-white"
      >
        Kaydet
      </button>
      <ErrorText>{error}</ErrorText>
    </form>
  );
}
