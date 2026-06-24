import { describe, it, expect } from "vitest";
import { assembleAdminQuestions } from "@/lib/admin/quiz-shape";

const questions = [
  { id: "q1", metin: "Soru 1", sira: 1 },
  { id: "q2", metin: "Soru 2", sira: 2 },
];

describe("assembleAdminQuestions", () => {
  it("seçenekleri (dogru dahil) gruplar, question_id'yi çıkarır", () => {
    const out = assembleAdminQuestions(
      questions,
      [
        { id: "o1", question_id: "q1", metin: "A", dogru: true, sira: 1 },
        { id: "o2", question_id: "q1", metin: "B", dogru: false, sira: 2 },
      ],
      new Map(),
    );
    expect(out[0].options.map((o) => o.id)).toEqual(["o1", "o2"]);
    expect(out[0].options[0].dogru).toBe(true);
    expect(out[0].options[0]).not.toHaveProperty("question_id");
  });

  it("açıklamayı haritadan ekler; eksikse null", () => {
    const out = assembleAdminQuestions(questions, [], new Map([["q1", "Açıklama 1"]]));
    expect(out[0].aciklama).toBe("Açıklama 1");
    expect(out[1].aciklama).toBeNull();
  });

  it("seçeneği olmayan soru → boş options", () => {
    const out = assembleAdminQuestions(questions, [], new Map());
    expect(out[0].options).toEqual([]);
    expect(out[1].options).toEqual([]);
  });

  it("soru sırasını korur, hiç soru yoksa []", () => {
    expect(assembleAdminQuestions([], [], new Map())).toEqual([]);
  });
});
