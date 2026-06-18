"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOption, toggleOption, deleteOption } from "@/app/actions/admin-quiz";

export function OptionRow({
  option,
}: {
  option: { id: string; metin: string; dogru: boolean; sira: number };
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function saveText(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await updateOption(fd);
      if (!r.ok) window.alert(r.error ?? "Hata");
      else router.refresh();
    });
  }
  function toggle() {
    start(async () => {
      const r = await toggleOption(option.id, !option.dogru);
      if (!r.ok) window.alert(r.error ?? "Hata");
      else router.refresh();
    });
  }
  function del() {
    start(async () => {
      const r = await deleteOption(option.id);
      if (!r.ok) window.alert(r.error ?? "Hata");
      else router.refresh();
    });
  }

  return (
    <form onSubmit={saveText} className="flex items-center gap-2">
      <input type="hidden" name="id" value={option.id} />
      <input
        type="checkbox"
        checked={option.dogru}
        onChange={toggle}
        disabled={pending}
        title="Doğru cevap"
        className="h-4 w-4"
      />
      <input
        name="metin"
        defaultValue={option.metin}
        placeholder="Şık metni"
        className="flex-1 rounded-lg border border-[var(--line)] bg-transparent px-2.5 py-1.5 text-sm text-navy outline-none focus:border-gold dark:text-white"
      />
      <button type="submit" disabled={pending} className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold text-navy dark:bg-white/10 dark:text-white">
        Kaydet
      </button>
      <button type="button" onClick={del} disabled={pending} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
        Sil
      </button>
    </form>
  );
}
