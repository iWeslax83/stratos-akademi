import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CurriculumBrowser } from "@/components/curriculum/CurriculumBrowser";
import type { Curriculum } from "@/lib/curriculum/types";

function lesson(id: string, baslik: string) {
  return { id, baslik, youtube_video_id: "x", aciklama: null, sure_sn: null, sira: 1 };
}

const CUR: Curriculum = [
  {
    id: "t1",
    slug: "elektronik",
    ad: "Elektronik",
    aciklama: null,
    ikon: "⚡",
    sira: 1,
    modules: [
      {
        id: "m1",
        ad: "Lehimleme",
        aciklama: null,
        sira: 1,
        quiz: null,
        lessons: [lesson("l1", "Havya kullanımı"), lesson("l2", "İlk lehim")],
      },
    ],
  },
];

describe("CurriculumBrowser", () => {
  it("başlangıçta tüm dersleri gösterir", () => {
    render(<CurriculumBrowser curriculum={CUR} statuses={{}} />);
    expect(screen.getByText("Havya kullanımı")).toBeInTheDocument();
    expect(screen.getByText("İlk lehim")).toBeInTheDocument();
  });

  it("arama eşleşmeyen dersleri gizler ve sonuç sayısını gösterir", () => {
    render(<CurriculumBrowser curriculum={CUR} statuses={{}} />);
    fireEvent.change(screen.getByLabelText("Müfredatta ara"), { target: { value: "havya" } });
    expect(screen.getByText("Havya kullanımı")).toBeInTheDocument();
    expect(screen.queryByText("İlk lehim")).not.toBeInTheDocument();
    expect(screen.getByText(/1 ders bulundu/)).toBeInTheDocument();
  });

  it("sonuç yoksa mesaj gösterir", () => {
    render(<CurriculumBrowser curriculum={CUR} statuses={{}} />);
    fireEvent.change(screen.getByLabelText("Müfredatta ara"), { target: { value: "zzzz" } });
    expect(screen.getByText(/sonuç yok/)).toBeInTheDocument();
  });
});
