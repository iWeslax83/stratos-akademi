"use client";

import { updateOption, toggleOption, deleteOption } from "@/app/actions/admin-quiz";
import { ErrorText } from "@/components/ui/ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";
import { smallButtonClasses } from "@/components/ui/Button";

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
          className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-transparent px-2.5 py-1.5 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <button type="submit" disabled={pending} className={smallButtonClasses("ghost")}>
          Kaydet
        </button>
        <button type="button" onClick={del} disabled={pending} className={smallButtonClasses("danger")}>
          Sil
        </button>
      </form>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
