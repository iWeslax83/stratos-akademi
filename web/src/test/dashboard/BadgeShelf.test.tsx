import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BadgeShelf } from "@/components/dashboard/BadgeShelf";
import { badgeProgress, nextBadge } from "@/lib/badges/compute";
import type { BadgeStats } from "@/lib/badges/catalog";

const ZERO: BadgeStats = {
  lessons: 0,
  tasks: 0,
  competencies: 0,
  points: 0,
  streak: 0,
  quizPerfect: 0,
};

describe("BadgeShelf", () => {
  it("kazanılan / toplam sayısını başlıkta gösterir", () => {
    const stats = { ...ZERO, lessons: 5 }; // İlk Adım + Meraklı = 2
    render(<BadgeShelf items={badgeProgress(stats, "full")} />);
    expect(screen.getByText(/2 \/ 15/)).toBeInTheDocument();
  });

  it("kazanılan rozetin adını gösterir", () => {
    const stats = { ...ZERO, lessons: 1 };
    render(<BadgeShelf items={badgeProgress(stats, "full")} />);
    expect(screen.getByTitle("İlk dersini tamamladın")).toBeInTheDocument();
    expect(screen.getAllByText("İlk Adım").length).toBeGreaterThan(0);
  });

  it("sıradaki rozet ipucunu kalan miktarla gösterir", () => {
    const stats = { ...ZERO, lessons: 3 };
    render(<BadgeShelf items={badgeProgress(stats, "full")} next={nextBadge(stats, "full")} />);
    // lessons 3 → en yakın Meraklı (5), kalan 2 ders
    const hint = screen.getByText(/Sıradaki/);
    expect(hint.textContent).toMatch(/Meraklı/);
    expect(hint.textContent).toMatch(/2 ders/);
  });

  it("public scope yalnız 10 rozet gösterir", () => {
    render(<BadgeShelf items={badgeProgress(ZERO, "public")} />);
    expect(screen.getByText(/0 \/ 10/)).toBeInTheDocument();
  });

  it("özel başlık geçilebilir", () => {
    render(<BadgeShelf items={badgeProgress(ZERO, "full")} baslik="Başarılar" />);
    expect(screen.getByText(/Başarılar/)).toBeInTheDocument();
  });
});
