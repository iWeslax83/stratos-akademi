import { describe, it, expect } from "vitest";
import { rangeStartISO, parseAralik, aralikLabel } from "@/lib/dashboard/range";

const NOW = Date.UTC(2026, 5, 18, 12, 0, 0); // 2026-06-18T12:00:00Z

describe("rangeStartISO", () => {
  it("tüm zamanlar → null", () => {
    expect(rangeStartISO("tum", NOW)).toBeNull();
  });
  it("hafta → 7 gün önce", () => {
    expect(rangeStartISO("hafta", NOW)).toBe(new Date(NOW - 7 * 86400000).toISOString());
  });
  it("ay → 30 gün önce", () => {
    expect(rangeStartISO("ay", NOW)).toBe(new Date(NOW - 30 * 86400000).toISOString());
  });
});

describe("parseAralik", () => {
  it("geçerli değerler", () => {
    expect(parseAralik("ay")).toBe("ay");
    expect(parseAralik("hafta")).toBe("hafta");
  });
  it("geçersiz/boş → tum", () => {
    expect(parseAralik(undefined)).toBe("tum");
    expect(parseAralik("xyz")).toBe("tum");
  });
});

describe("aralikLabel", () => {
  it("etiketler", () => {
    expect(aralikLabel("tum")).toBe("Tüm zamanlar");
    expect(aralikLabel("ay")).toBe("Son 30 gün");
    expect(aralikLabel("hafta")).toBe("Son 7 gün");
  });
});
