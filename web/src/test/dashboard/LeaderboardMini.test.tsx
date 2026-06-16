import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeaderboardMini } from "@/components/dashboard/LeaderboardMini";
import type { LeaderRow } from "@/lib/dashboard/leaderboard";

const rows: LeaderRow[] = [
  { userId: "u1", gorunenAd: "Demir Ö.", puan: 2150, sira: 1 },
  { userId: "u2", gorunenAd: "Berke A.", puan: 1780, sira: 2 },
  { userId: "u3", gorunenAd: "Erdem G.", puan: 1510, sira: 3 },
  { userId: "u4", gorunenAd: "Sen", puan: 1240, sira: 4 },
];

describe("LeaderboardMini", () => {
  it("ilk 3'ü ve top3 dışındaysam beni gösterir", () => {
    render(<LeaderboardMini rows={rows} meUserId="u4" />);
    expect(screen.getByText("Demir Ö.")).toBeInTheDocument();
    expect(screen.getByText("Erdem G.")).toBeInTheDocument();
    expect(screen.getByText("Sen")).toBeInTheDocument();
  });
  it("boş listede yüklenemedi mesajı", () => {
    render(<LeaderboardMini rows={[]} meUserId="u4" />);
    expect(screen.getByText(/yüklenemedi/)).toBeInTheDocument();
  });
});
