import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PointsBreakdown } from "@/components/dashboard/PointsBreakdown";

describe("PointsBreakdown", () => {
  it("parçaları ve toplamı gösterir", () => {
    render(<PointsBreakdown data={{ ders: 160, quiz: 165, gorev: 60, toplam: 385 }} />);
    expect(screen.getByText("Dersler")).toBeInTheDocument();
    expect(screen.getByText("160")).toBeInTheDocument();
    expect(screen.getByText("165")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("Toplam")).toBeInTheDocument();
    expect(screen.getByText("385")).toBeInTheDocument();
  });
});
