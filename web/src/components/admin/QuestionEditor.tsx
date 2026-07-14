"use client";

import { updateQuestion, deleteQuestion, createOption } from "@/app/actions/admin-quiz";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { ErrorText } from "@/components/ui/ErrorText";
import { useServerAction } from "@/lib/ui/useServerAction";
import { OptionRow } from "./OptionRow";
import { ActionButton } from "./ActionButton";

type Q = {
  id: string;
  metin: string;
  sira: number;
  aciklama: string | null;
  options: { id: string; metin: string; dogru: boolean; sira: number }[];
};

export function QuestionEditor({ question, index }: { question: Q; index: number }) {
  const { pending, error, run } = useServerAction("Hata");

  function saveText(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    run(() => updateQuestion(fd));
  }
  const hasCorrect = question.options.some((o) => o.dogru);

  return (
    <div className="rounded-core border border-[var(--line)] p-4">
      <form onSubmit={saveText} className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted">{index + 1}.</span>
          <input type="hidden" name="id" value={question.id} />
          <input
            name="metin"
            defaultValue={question.metin}
            placeholder="Soru metni"
            className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-transparent px-3 py-2 text-sm font-semibold text-navy outline-none focus:border-accent dark:text-white"
          />
          <button type="submit" disabled={pending} className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-navy dark:bg-white/10 dark:text-white">
            Kaydet
          </button>
          <ConfirmButton
            onConfirm={() => deleteQuestion(question.id)}
            soru="Bu soru ve şıkları silinsin mi?"
          />
        </div>
        <input
          name="aciklama"
          defaultValue={question.aciklama ?? ""}
          placeholder="Açıklama (cevaptan sonra gösterilir — opsiyonel)"
          className="w-full rounded-lg border border-[var(--line)] bg-transparent px-3 py-2 text-xs text-muted outline-none focus:border-accent dark:text-white"
        />
      </form>
      <ErrorText>{error}</ErrorText>

      <div className="mt-3 space-y-2 pl-6">
        {question.options.map((o) => (
          <OptionRow key={o.id} option={o} />
        ))}
        <div className="flex items-center gap-3 pt-1">
          <ActionButton onAction={createOption.bind(null, question.id)}>+ Şık ekle</ActionButton>
          {!hasCorrect && <span className="text-xs font-semibold text-amber-600">doğru şık seçilmedi</span>}
        </div>
      </div>
    </div>
  );
}
