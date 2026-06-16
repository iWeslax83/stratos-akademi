import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import type { Quiz } from "@/lib/quiz/types";

vi.mock("@/app/actions/quiz", () => ({
  submitQuiz: vi.fn(async () => ({
    ok: true,
    result: {
      puan: 100,
      gecti: true,
      perQuestion: [{ questionId: "q1", dogruMu: true }],
      correctByQuestion: { q1: ["o1"] },
    },
  })),
}));

const quiz: Quiz = {
  id: "z1",
  module_id: "m1",
  baslik: "Test Quiz",
  gecme_esigi: 70,
  questions: [
    { id: "q1", metin: "Soru 1", sira: 1, options: [
      { id: "o1", metin: "A", sira: 1 },
      { id: "o2", metin: "B", sira: 2 },
    ] },
  ],
};

describe("QuizRunner", () => {
  it("şık seçip gönderince puanı gösterir", async () => {
    render(<QuizRunner quiz={quiz} best={null} />);
    await userEvent.click(screen.getByText("A"));
    await userEvent.click(screen.getByRole("button", { name: "Gönder" }));
    expect(await screen.findByText(/Puanın: %100/)).toBeInTheDocument();
    expect(screen.getByText(/Geçtin/)).toBeInTheDocument();
  });
});
