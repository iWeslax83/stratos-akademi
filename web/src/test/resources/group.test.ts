import { describe, it, expect } from "vitest";
import { isValidHttpUrl, groupByCategory, KATEGORILER } from "@/lib/resources/group";

describe("isValidHttpUrl", () => {
  it("http/https geçerli (boşluk kırpılır)", () => {
    expect(isValidHttpUrl("https://example.com/x")).toBe(true);
    expect(isValidHttpUrl("  http://a.b ")).toBe(true);
  });
  it("diğer protokoller ve geçersiz girdi reddedilir", () => {
    expect(isValidHttpUrl("ftp://a.b")).toBe(false);
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpUrl("sadece-metin")).toBe(false);
    expect(isValidHttpUrl("")).toBe(false);
  });
});

describe("groupByCategory", () => {
  const items = [
    { id: "1", kategori: "Genel" },
    { id: "2", kategori: "Datasheet" },
    { id: "3", kategori: "Datasheet" },
    { id: "4", kategori: "Zürafa" }, // listede yok
  ];

  it("kategorileri KATEGORILER sırasına göre düzenler, bilinmeyen sona", () => {
    const r = groupByCategory(items, KATEGORILER);
    expect(r.map((g) => g.kategori)).toEqual(["Datasheet", "Genel", "Zürafa"]);
  });

  it("grup içi sıra girdiyle aynı", () => {
    const r = groupByCategory(items, KATEGORILER);
    const ds = r.find((g) => g.kategori === "Datasheet")!;
    expect(ds.items.map((i) => i.id)).toEqual(["2", "3"]);
  });

  it("boş girdi → boş", () => {
    expect(groupByCategory([], KATEGORILER)).toEqual([]);
  });
});
