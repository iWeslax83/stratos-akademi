import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { StatStrip } from "@/components/admin/StatStrip";

const items = [
  { label: "Üye", value: "12" },
  { label: "Aktif (7g)", value: "9" },
  { label: "Ort. tamamlama", value: "%64" },
];

describe("StatStrip", () => {
  it("her sayıyı etiketiyle bir tanım listesinde (dl) verir", () => {
    const { container } = render(<StatStrip items={items} />);
    const dl = container.querySelector("dl");
    expect(dl).not.toBeNull();
    expect(dl!.querySelectorAll("dt")).toHaveLength(3);
    expect(dl!.querySelectorAll("dd")).toHaveLength(3);
  });
  it("etiket ve değer aynı grupta, değer tabular-nums", () => {
    render(<StatStrip items={items} />);
    const grup = screen.getByText("Ort. tamamlama").closest("div")!;
    const deger = within(grup).getByText("%64");
    expect(deger.className).toContain("tabular-nums");
  });
  it("tek kart içinde durur (her sayı için ayrı kart yok)", () => {
    const { container } = render(<StatStrip items={items} />);
    expect(container.querySelectorAll(".rounded-bezel")).toHaveLength(1);
  });
});
