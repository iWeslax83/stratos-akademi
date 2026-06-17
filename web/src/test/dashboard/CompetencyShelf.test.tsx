import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompetencyShelf } from "@/components/dashboard/CompetencyShelf";

const tracks = [
  { slug: "ortak-temel", ad: "Ortak Temel", ikon: "🚀" },
  { slug: "elektronik", ad: "Elektronik", ikon: "⚡" },
  { slug: "yazilim", ad: "Yazılım", ikon: "💻" },
];

describe("CompetencyShelf", () => {
  it("kazanılan/toplam sayısını ve sıralamayı gösterir", () => {
    render(<CompetencyShelf tracks={tracks} earned={["ortak-temel", "elektronik"]} rank={4} />);
    expect(screen.getByText(/2 \/ 3/)).toBeInTheDocument();
    expect(screen.getByText("#4")).toBeInTheDocument();
  });
  it("rank null ise sıralama gizli", () => {
    render(<CompetencyShelf tracks={tracks} earned={[]} rank={null} />);
    expect(screen.getByText(/0 \/ 3/)).toBeInTheDocument();
    expect(screen.queryByText(/Sıralaman/)).not.toBeInTheDocument();
  });
});
