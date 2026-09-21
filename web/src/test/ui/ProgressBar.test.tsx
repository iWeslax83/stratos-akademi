import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "@/components/ui/ProgressBar";

describe("ProgressBar", () => {
  it("progressbar rolü, değer ve etiketi erişilebilir verir", () => {
    render(<ProgressBar pct={40} label="Toplam ilerleme" />);
    const bar = screen.getByRole("progressbar", { name: "Toplam ilerleme" });
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });
  it("değeri 0 ile 100 arasına sıkıştırır ve yuvarlar", () => {
    const { rerender } = render(<ProgressBar pct={140} label="a" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    rerender(<ProgressBar pct={-5} label="a" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    rerender(<ProgressBar pct={66.6} label="a" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "67");
  });
  it("dolgu genişliği yüzdeyle eşleşir", () => {
    const { container } = render(<ProgressBar pct={25} label="a" />);
    expect(container.querySelector("[data-fill]")).toHaveStyle({ width: "25%" });
  });
});
