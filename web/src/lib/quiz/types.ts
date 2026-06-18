export type QuizOption = { id: string; metin: string; sira: number };
export type QuizQuestion = { id: string; metin: string; sira: number; options: QuizOption[] };
export type Quiz = {
  id: string;
  module_id: string;
  baslik: string;
  gecme_esigi: number;
  questions: QuizQuestion[];
};

export type AnswerMap = Record<string, string[]>;
export type ScorableQuestion = { id: string; correctOptionIds: string[] };
export type QuestionResult = { questionId: string; dogruMu: boolean };
export type QuizResult = { puan: number; gecti: boolean; perQuestion: QuestionResult[] };
export type SubmitResult = QuizResult & {
  correctByQuestion: Record<string, string[]>;
  aciklamaByQuestion: Record<string, string | null>;
};
