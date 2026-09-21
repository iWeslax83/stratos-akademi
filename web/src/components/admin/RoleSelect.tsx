"use client";

import { setMemberRole } from "@/app/actions/admin-members";
import { ErrorText } from "@/components/ui/ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";
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
  const { pending, error, run } = useServerAction("Hata");
  const isSelf = userId !== null && userId === selfId;

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const yeni = e.target.value as Role;
    run(() => setMemberRole(email, yeni, userId));
  }

  return (
    <span>
      <select
        value={role}
        onChange={onChange}
        disabled={pending || isSelf}
        aria-label={`${email} rolü`}
        className="rounded-lg border border-[var(--line)] bg-transparent px-2.5 py-1.5 text-sm font-semibold text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60 [&>option]:bg-[var(--panel)] [&>option]:text-navy dark:[&>option]:text-white"
      >
        <option value="uye">Üye</option>
        <option value="admin">Admin</option>
      </select>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}
