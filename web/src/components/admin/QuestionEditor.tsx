"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateQuestion, deleteQuestion, createOption } from "@/app/actions/admin-quiz";
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
  const [pending, start] = useTransition();
  const router = useRouter();

  function saveText(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await updateQuestion(fd);
      if (!r.ok) window.alert(r.error ?? "Hata");
      else router.refresh();
    });
  }
  function del() {
    if (!window.confirm("Bu soruyu ve şıklarını silmek istediğine emin misin?")) return;
    start(async () => {
      const r = await deleteQuestion(question.id);
      if (!r.ok) window.alert(r.error ?? "Hata");
      else router.refresh();
    });
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
            className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-transparent px-3 py-2 text-sm font-semibold text-navy outline-none focus:border-gold dark:text-white"
          />
          <button type="submit" disabled={pending} className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-navy dark:bg-white/10 dark:text-white">
            Kaydet
          </button>
          <button type="button" onClick={del} disabled={pending} className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
            Sil
          </button>
        </div>
        <input
          name="aciklama"
          defaultValue={question.aciklama ?? ""}
          placeholder="Açıklama (cevaptan sonra gösterilir — opsiyonel)"
          className="w-full rounded-lg border border-[var(--line)] bg-transparent px-3 py-2 text-xs text-muted outline-none focus:border-gold dark:text-white"
        />
      </form>

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
