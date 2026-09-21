import { describe, it, expect } from "vitest";
import { formatSure } from "@/lib/lessons/format";

describe("formatSure", () => {
  it("dakika:saniye biçimi", () => {
    expect(formatSure(45)).toBe("0:45");
    expect(formatSure(631)).toBe("10:31");
  });
  it("bir saat ve üstü saat:dk:sn", () => {
    expect(formatSure(3723)).toBe("1:02:03");
  });
  it("boş ya da geçersiz süre için tire", () => {
    expect(formatSure(0)).toBe("-");
    expect(formatSure(null)).toBe("-");
    expect(formatSure(Number.NaN)).toBe("-");
  });
});
