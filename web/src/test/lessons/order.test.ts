import { describe, it, expect } from "vitest";
import { moveOrder } from "@/lib/lessons/order";

describe("moveOrder", () => {
  const rows = [
    { id: "a", sira: 0 },
    { id: "b", sira: 1 },
    { id: "c", sira: 2 },
  ];
  it("yukarı taşır ve yalnız değişen satırları döner", () => {
    expect(moveOrder(rows, "c", "yukari")).toEqual([
      { id: "c", sira: 1 },
      { id: "b", sira: 2 },
    ]);
  });
  it("aşağı taşır", () => {
    expect(moveOrder(rows, "a", "asagi")).toEqual([
      { id: "b", sira: 0 },
      { id: "a", sira: 1 },
    ]);
  });
  it("sınırda boş liste döner", () => {
    expect(moveOrder(rows, "a", "yukari")).toEqual([]);
    expect(moveOrder(rows, "c", "asagi")).toEqual([]);
  });
  it("bilinmeyen id için boş liste döner", () => {
    expect(moveOrder(rows, "z", "yukari")).toEqual([]);
  });
  it("çakışan ve boşluklu sıraları 0..n-1 olarak düzeltir", () => {
    const bozuk = [
      { id: "a", sira: 0 },
      { id: "b", sira: 0 },
      { id: "c", sira: 0 },
    ];
    expect(moveOrder(bozuk, "c", "yukari")).toEqual([
      { id: "c", sira: 1 },
      { id: "b", sira: 2 },
    ]);
    const bosluklu = [
      { id: "a", sira: 3 },
      { id: "b", sira: 9 },
    ];
    expect(moveOrder(bosluklu, "b", "yukari")).toEqual([
      { id: "b", sira: 0 },
      { id: "a", sira: 1 },
    ]);
  });
});
