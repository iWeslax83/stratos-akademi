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
    run(() => renameMember(userId, value));
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-1.5">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={pending || isSelf}
        placeholder="Ad Soyad"
        aria-label="Üye adı"
        autoComplete="off"
        className="w-36 rounded-lg border border-[var(--line)] bg-transparent px-2.5 py-1.5 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={pending || isSelf}
        className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-sm font-semibold text-fg hover:border-accent disabled:opacity-60"
      >
        Kaydet
      </button>
      <ErrorText>{error}</ErrorText>
    </form>
  );
}
