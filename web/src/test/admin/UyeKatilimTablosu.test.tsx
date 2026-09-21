import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { UyeKatilimTablosu, sonEtkinlikMetni } from "@/components/admin/UyeKatilimTablosu";

const uyeler = [
  { id: "1", ad: "Ayşe Kaya", puan: 120, ders: 8, gun: 0, aktif: true },
  { id: "2", ad: "Mert Demir", puan: 40, ders: 3, gun: 12, aktif: false },
  { id: "3", ad: "Yeni Üye", puan: 0, ders: 0, gun: null, aktif: false },
];

describe("sonEtkinlikMetni", () => {
  it("hiç, bugün ve gün önce metinleri", () => {
    expect(sonEtkinlikMetni(null)).toBe("hiç");
    expect(sonEtkinlikMetni(0)).toBe("bugün");
    expect(sonEtkinlikMetni(12)).toBe("12 gün önce");
  });
});

describe("UyeKatilimTablosu", () => {
  it("gerçek bir tablo: başlık, sütun başlıkları ve her üye için satır", () => {
    render(<UyeKatilimTablosu uyeler={uyeler} />);
    const table = screen.getByRole("table", { name: "Üye katılımı" });
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "Üye", "Ders", "Puan", "Son etkinlik",
    ]);
    expect(within(table).getAllByRole("row")).toHaveLength(1 + uyeler.length);
  });
  it("satır değerlerini gösterir", () => {
    render(<UyeKatilimTablosu uyeler={uyeler} />);
    const row = screen.getByRole("row", { name: /Mert Demir/ });
    expect(within(row).getByText("3")).toBeInTheDocument();
    expect(within(row).getByText("40")).toBeInTheDocument();
    expect(within(row).getByText("12 gün önce")).toBeInTheDocument();
  });
  it("sayı sütunları tabular-nums ve sağa hizalı", () => {
    render(<UyeKatilimTablosu uyeler={uyeler} />);
    const cell = within(screen.getByRole("row", { name: /Ayşe Kaya/ })).getByText("120");
    expect(cell.className).toContain("tabular-nums");
    expect(cell.className).toContain("text-right");
  });
  it("üye yoksa boş durum metni", () => {
    render(<UyeKatilimTablosu uyeler={[]} />);
    expect(screen.getByText("Üye yok.")).toBeInTheDocument();
  });
});
