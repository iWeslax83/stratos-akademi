import { describe, it, expect } from "vitest";
import { clamp01, easeOutCubic, countValue } from "@/lib/ui/countup";

describe("clamp01", () => {
  it("aralığa sıkıştırır", () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(0)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(1)).toBe(1);
    expect(clamp01(2)).toBe(1);
  });
});

describe("easeOutCubic", () => {
  it("uçlar 0 ve 1", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });
  it("yavaşlayan: yarıda yarıdan fazla ilerler", () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
  it("monoton artar", () => {
    expect(easeOutCubic(0.3)).toBeLessThan(easeOutCubic(0.6));
  });
});

describe("countValue", () => {
  it("0'da 0, 1'de target", () => {
    expect(countValue(100, 0)).toBe(0);
    expect(countValue(100, 1)).toBe(100);
  });
  it("ara değer tamsayı ve aralıkta", () => {
    const v = countValue(100, 0.5);
    expect(Number.isInteger(v)).toBe(true);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(100);
  });
  it("target 0 → hep 0", () => {
    expect(countValue(0, 0.4)).toBe(0);
  });
});
