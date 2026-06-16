import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CurriculumTree } from "@/components/curriculum/CurriculumTree";
import type { Curriculum } from "@/lib/curriculum/types";
import { computeStatuses } from "@/lib/curriculum/progress";

const curriculum: Curriculum = [
  {
    id: "t1", slug: "ortak", ad: "Ortak Temel", aciklama: null, ikon: "🚀", sira: 1,
    modules: [
      { id: "m1", ad: "Drone Temelleri", aciklama: null, sira: 1, quiz: null, lessons: [
        { id: "a", baslik: "Ders A", youtube_video_id: "x", aciklama: null, sure_sn: null, sira: 1 },
        { id: "b", baslik: "Ders B", youtube_video_id: "y", aciklama: null, sure_sn: null, sira: 2 },
      ] },
    ],
  },
];

describe("CurriculumTree", () => {
  it("dal, modül ve dersleri durum işaretiyle gösterir", () => {
    const statuses = computeStatuses(curriculum, new Set(["a"]));
    render(<CurriculumTree curriculum={curriculum} statuses={statuses} activeLessonId={null} />);
    expect(screen.getByText("Ortak Temel")).toBeInTheDocument();
    expect(screen.getByText("Drone Temelleri")).toBeInTheDocument();
    expect(screen.getByTestId("status-a")).toHaveTextContent("✓");
    expect(screen.getByTestId("status-b")).toHaveTextContent("●");
  });
});
