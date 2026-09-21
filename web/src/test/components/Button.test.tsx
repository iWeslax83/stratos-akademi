import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, smallButtonClasses } from "@/components/ui/Button";

describe("Button", () => {
  it("etiketi gösterir ve tıklamayı iletir", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Devam et</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Devam et" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("icon verilince buton-içinde-buton yuvasını render eder", () => {
    render(<Button icon="→">Sonraki</Button>);
    expect(screen.getByTestId("btn-icon")).toHaveTextContent("→");
  });
});

describe("smallButtonClasses", () => {
  it("her ton ortak tabanı (odak halkası, disabled, hover) taşır", () => {
    for (const tone of ["ghost", "soft", "primary", "accent", "danger", "dangerSolid", "success"] as const) {
      const c = smallButtonClasses(tone);
      expect(c).toContain("focus-visible:ring-2");
      expect(c).toContain("disabled:opacity-50");
      expect(c).toContain("hover:");
      expect(c).toContain("rounded-full");
    }
  });
  it("başarı düğmesi beyaz metinde yeterli kontrast için green-700 kullanır", () => {
    expect(smallButtonClasses("success")).toContain("bg-green-700");
    expect(smallButtonClasses("success")).not.toContain("bg-green-600");
  });
  it("ek sınıfı sona ekler", () => {
    expect(smallButtonClasses("ghost", "shrink-0")).toMatch(/shrink-0$/);
  });
});
