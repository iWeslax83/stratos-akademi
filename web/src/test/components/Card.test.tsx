import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "@/components/ui/Card";

describe("Card", () => {
  it("çocuk içeriği bir iç çekirdek (core) içinde gösterir", () => {
    render(
      <Card>
        <span>içerik</span>
      </Card>,
    );
    const child = screen.getByText("içerik");
    const core = child.parentElement!;
    const shell = core.parentElement!;
    expect(core).toHaveClass("rounded-core");
    expect(shell).toHaveClass("rounded-bezel");
  });
});
