import type { QuizOption, QuizQuestion } from "./types";

// Seçenekleri sorulara bağlar (uygulama-içi join). question_id seçenekten çıkarılır;
// seçenek girdi sırası korunur. getQuiz'den ayrıştırıldı → test edilebilir.
export function groupOptionsByQuestion(
  questions: { id: string; metin: string; sira: number }[],
  options: (QuizOption & { question_id: string })[],
): QuizQuestion[] {
  const byQuestion = new Map<string, QuizOption[]>();
  for (const row of options) {
    const { question_id, ...opt } = row;
    const arr = byQuestion.get(question_id) ?? [];
    arr.push(opt);
    byQuestion.set(question_id, arr);
  }
  return questions.map((q) => ({ ...q, options: byQuestion.get(q.id) ?? [] }));
}
