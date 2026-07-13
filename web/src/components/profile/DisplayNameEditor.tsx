"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { updateDisplayName } from "@/app/actions/profile";

export function DisplayNameEditor({ userId, current }: { userId: string; current: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(current);
          setError(null);
          setEditing(true);
        }}
        className="text-xs font-semibold text-accent-ink dark:text-accent hover:underline"
      >
        Adı düzenle
      </button>
    );
  }

  function save() {
    setError(null);
    start(async () => {
      const r = await updateDisplayName(userId, value);
      if (!r.ok) {
        setError(r.error ?? "Hata");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={80}
        aria-label="Görünen ad"
        className="w-56 rounded-xl border border-[var(--line)] bg-transparent px-3 py-1.5 text-sm text-navy outline-none focus:border-accent dark:text-white"
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
      />
      <Button variant="accent" onClick={save} disabled={pending}>
        {pending ? "…" : "Kaydet"}
      </Button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-xs font-semibold text-muted hover:underline"
      >
        Vazgeç
      </button>
      {error && <p className="w-full text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
}
