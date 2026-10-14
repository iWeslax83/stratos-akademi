import { describe, it, expect } from "vitest";
import { QUIZ_SIZE, isValidSeed, pickQuestionIds } from "@/lib/quiz/pick";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `q${String(i).padStart(2, "0")}`);

describe("pickQuestionIds", () => {
  it("havuz küçükse hepsini döndürür", () => {
    expect(pickQuestionIds(ids(6), 1)).toEqual(ids(6));
    expect(pickQuestionIds(ids(QUIZ_SIZE), 99)).toHaveLength(QUIZ_SIZE);
  });

  it("havuz büyükse tam QUIZ_SIZE soru seçer, tekrar yok", () => {
    const picked = pickQuestionIds(ids(27), 123);
    expect(picked).toHaveLength(QUIZ_SIZE);
    expect(new Set(picked).size).toBe(QUIZ_SIZE);
    for (const id of picked) expect(ids(27)).toContain(id);
  });

  it("aynı seed ve havuz aynı kümeyi verir (girdi sırasından bağımsız)", () => {
    const a = pickQuestionIds(ids(27), 42);
    const b = pickQuestionIds([...ids(27)].reverse(), 42);
    expect([...a].sort()).toEqual([...b].sort());
  });

  it("farklı seed farklı küme verir", () => {
    const sets = new Set([1, 2, 3, 4, 5].map((s) => pickQuestionIds(ids(27), s).sort().join(",")));
    expect(sets.size).toBeGreaterThan(1);
  });

  it("girdiyi değiştirmez", () => {
    const input = ids(27);
    const copy = [...input];
    pickQuestionIds(input, 7);
    expect(input).toEqual(copy);
  });
});

describe("isValidSeed", () => {
  it("yalnız 0..2^31-1 tamsayıları kabul eder", () => {
    expect(isValidSeed(0)).toBe(true);
    expect(isValidSeed(2147483647)).toBe(true);
    expect(isValidSeed(-1)).toBe(false);
    expect(isValidSeed(1.5)).toBe(false);
    expect(isValidSeed("5")).toBe(false);
    expect(isValidSeed(undefined)).toBe(false);
    expect(isValidSeed(2147483648)).toBe(false);
  });
});
