"use client";

import { updateOption, toggleOption, deleteOption } from "@/app/actions/admin-quiz";
import { ErrorText } from "@/components/ui/ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";

export function OptionRow({
  option,
}: {
  option: { id: string; metin: string; dogru: boolean; sira: number };
}) {
  const { pending, error, run } = useServerAction("Hata");

  function saveText(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    run(() => updateOption(fd));
  }
  function toggle() {
    run(() => toggleOption(option.id, !option.dogru));
  }
  function del() {
    run(() => deleteOption(option.id));
  }

  return (
    <div>
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
          className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-transparent px-2.5 py-1.5 text-sm text-navy outline-none focus:border-accent dark:text-white"
        />
        <button type="submit" disabled={pending} className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold text-navy dark:bg-white/10 dark:text-white">
          Kaydet
        </button>
        <button type="button" onClick={del} disabled={pending} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
          Sil
        </button>
      </form>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
