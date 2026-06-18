"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { inviteMember } from "@/app/actions/admin-members";

export function InviteForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    start(async () => {
      const r = await inviteMember(fd);
      if (!r.ok) { setError(r.error ?? "Hata"); return; }
      form.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      {error && <p className="w-full text-sm font-semibold text-red-600">{error}</p>}
      <label className="block min-w-[220px] flex-1">
        <span className="mb-1 block text-xs font-semibold text-muted">E-posta</span>
        <input
          name="email"
          type="email"
          required
          placeholder="uye@okul.edu.tr"
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-gold dark:text-white"
        />
      </label>
      <label className="block w-32">
        <span className="mb-1 block text-xs font-semibold text-muted">Rol</span>
        <select
          name="role"
          defaultValue="uye"
          className="w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-navy outline-none focus:border-gold dark:text-white"
        >
          <option value="uye">Üye</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <Button variant="gold" disabled={pending}>{pending ? "…" : "Davet et"}</Button>
    </form>
  );
}
