import type { AdminOption, AdminQuestion } from "./quiz-queries";

// Admin quiz editörü için soruları seçenekleri (dogru dahil) ve açıklamayla birleştirir.
// getQuizForAdmin'den ayrıştırıldı → test edilebilir. Seçenek girdi sırası korunur.
export function assembleAdminQuestions(
  questions: { id: string; metin: string; sira: number }[],
  options: (AdminOption & { question_id: string })[],
  aciklamaById: Map<string, string | null>,
): AdminQuestion[] {
  const byQuestion = new Map<string, AdminOption[]>();
  for (const o of options) {
    const { question_id, ...rest } = o;
    const arr = byQuestion.get(question_id) ?? [];
    arr.push(rest);
    byQuestion.set(question_id, arr);
  }
  return questions.map((q) => ({
    ...q,
    aciklama: aciklamaById.get(q.id) ?? null,
    options: byQuestion.get(q.id) ?? [],
  }));
}
