"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMemberRole } from "@/app/actions/admin-members";
import type { Role } from "@/lib/admin/members";

export function RoleSelect({
  email,
  role,
  userId,
  selfId,
}: {
  email: string;
  role: Role;
  userId: string | null;
  selfId: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const isSelf = userId !== null && userId === selfId;

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const yeni = e.target.value as Role;
    start(async () => {
      const r = await setMemberRole(email, yeni, userId, selfId);
      if (!r.ok) window.alert(r.error ?? "Hata");
      router.refresh();
    });
  }

  return (
    <select
      value={role}
      onChange={onChange}
      disabled={pending || isSelf}
      className="rounded-lg border border-[var(--line)] bg-transparent px-2.5 py-1.5 text-sm font-semibold text-navy outline-none focus:border-accent disabled:opacity-60 dark:text-white"
    >
      <option value="uye">Üye</option>
      <option value="admin">Admin</option>
    </select>
  );
}
