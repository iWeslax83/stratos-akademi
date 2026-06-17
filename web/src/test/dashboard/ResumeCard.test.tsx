import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResumeCard } from "@/components/dashboard/ResumeCard";
import type { FlatLesson } from "@/lib/curriculum/types";

const resume: FlatLesson = {
  lesson: { id: "l1", baslik: "Drone Nasıl Uçar?", youtube_video_id: "v", aciklama: null, sure_sn: 600, sira: 1 },
  module: { id: "m1", ad: "Modül 2", aciklama: null, sira: 2, quiz: null, lessons: [] },
  track: { id: "t1", slug: "ortak-temel", ad: "Ortak Temel", aciklama: null, ikon: "🚀", sira: 1, modules: [] },
};

describe("ResumeCard", () => {
  it("kaldığın ders başlığını ve modül ilerlemesini gösterir", () => {
    render(<ResumeCard resume={resume} modulePct={40} kalanDk={12} allDone={false} />);
    expect(screen.getByText("Drone Nasıl Uçar?")).toBeInTheDocument();
    expect(screen.getByText(/Modül %40 tamamlandı/)).toBeInTheDocument();
    expect(screen.getByText(/12 dk kaldı/)).toBeInTheDocument();
  });
  it("resume yoksa ve hepsi bittiyse kutlama gösterir", () => {
    render(<ResumeCard resume={null} modulePct={0} kalanDk={0} allDone={true} />);
    expect(screen.getByText(/Tüm dersleri tamamladın/)).toBeInTheDocument();
  });
  it("resume yoksa ve müfredat boşsa bilgilendirir", () => {
    render(<ResumeCard resume={null} modulePct={0} kalanDk={0} allDone={false} />);
    expect(screen.getByText(/Müfredat yakında/)).toBeInTheDocument();
  });
});
