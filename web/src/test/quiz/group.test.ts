import { describe, it, expect } from "vitest";
import { groupOptionsByQuestion } from "@/lib/quiz/group";

const questions = [
  { id: "q1", metin: "Soru 1", sira: 1 },
  { id: "q2", metin: "Soru 2", sira: 2 },
];

describe("groupOptionsByQuestion", () => {
  it("seçenekleri doğru soruya bağlar ve question_id'yi çıkarır", () => {
    const out = groupOptionsByQuestion(questions, [
      { id: "o1", question_id: "q1", metin: "A", sira: 1 },
      { id: "o2", question_id: "q2", metin: "B", sira: 1 },
      { id: "o3", question_id: "q1", metin: "C", sira: 2 },
    ]);
    expect(out[0].options.map((o) => o.id)).toEqual(["o1", "o3"]);
    expect(out[1].options.map((o) => o.id)).toEqual(["o2"]);
    // question_id sızmamalı
    expect(out[0].options[0]).not.toHaveProperty("question_id");
  });

  it("seçenek girdi sırasını korur", () => {
    const out = groupOptionsByQuestion([{ id: "q1", metin: "S", sira: 1 }], [
      { id: "o3", question_id: "q1", metin: "C", sira: 3 },
      { id: "o1", question_id: "q1", metin: "A", sira: 1 },
      { id: "o2", question_id: "q1", metin: "B", sira: 2 },
    ]);
    expect(out[0].options.map((o) => o.id)).toEqual(["o3", "o1", "o2"]);
  });

  it("seçeneği olmayan soru → boş options", () => {
    const out = groupOptionsByQuestion(questions, [
      { id: "o1", question_id: "q1", metin: "A", sira: 1 },
    ]);
    expect(out[1].options).toEqual([]);
  });

  it("hiç soru yok → []", () => {
    expect(groupOptionsByQuestion([], [])).toEqual([]);
  });

  it("eşleşmeyen question_id'li seçenek yok sayılır", () => {
    const out = groupOptionsByQuestion([{ id: "q1", metin: "S", sira: 1 }], [
      { id: "ox", question_id: "yok", metin: "X", sira: 1 },
    ]);
    expect(out[0].options).toEqual([]);
  });
});
