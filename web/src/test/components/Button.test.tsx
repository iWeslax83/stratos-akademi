import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/Button";

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
