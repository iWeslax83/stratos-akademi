import type { AnswerMap, QuestionResult, QuizResult, ScorableQuestion } from "./types";

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((x) => setB.has(x));
}

export function scoreQuiz(
  questions: ScorableQuestion[],
  answers: AnswerMap,
  threshold: number,
): QuizResult {
  const perQuestion: QuestionResult[] = questions.map((q) => ({
    questionId: q.id,
    dogruMu: sameSet(answers[q.id] ?? [], q.correctOptionIds),
  }));
  const total = questions.length;
  const correct = perQuestion.filter((r) => r.dogruMu).length;
  const puan = total ? Math.round((correct / total) * 100) : 0;
  return { puan, gecti: total > 0 && puan >= threshold, perQuestion };
}
