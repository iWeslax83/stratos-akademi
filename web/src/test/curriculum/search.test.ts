import { describe, it, expect } from "vitest";
import { filterCurriculum, filterByStatus } from "@/lib/curriculum/search";
import type { Curriculum, LessonStatus } from "@/lib/curriculum/types";

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
      {
        id: "m2",
        ad: "PCB Tasarımı",
        aciklama: null,
        sira: 2,
        quiz: null,
        lessons: [lesson("l3", "KiCad'e giriş")],
      },
    ],
  },
  {
    id: "t2",
    slug: "yazilim",
    ad: "Yazılım",
    aciklama: null,
    ikon: "💻",
    sira: 2,
    modules: [
      {
        id: "m3",
        ad: "Python",
        aciklama: null,
        sira: 1,
        quiz: null,
        lessons: [lesson("l4", "Değişkenler"), lesson("l5", "Döngüler")],
      },
    ],
  },
];

describe("filterCurriculum", () => {
  it("boş sorgu → değişmeden döner", () => {
    expect(filterCurriculum(CUR, "")).toBe(CUR);
    expect(filterCurriculum(CUR, "   ")).toBe(CUR);
  });

  it("ders başlığına göre süzer, hiyerarşiyi korur, boş modül/dalı atar", () => {
    // "havya" yalnız ders başlığında (modül adı "Lehimleme" eşleşmez) → ders-bazlı süzme
    const r = filterCurriculum(CUR, "havya");
    expect(r).toHaveLength(1); // yalnız Elektronik
    expect(r[0].modules).toHaveLength(1); // yalnız Lehimleme
    expect(r[0].modules[0].lessons.map((l) => l.id)).toEqual(["l1"]); // yalnız "Havya kullanımı"
  });

  it("modül adı eşleşince modülün tüm dersleri gelir", () => {
    const r = filterCurriculum(CUR, "python");
    expect(r).toHaveLength(1);
    expect(r[0].modules[0].lessons.map((l) => l.id)).toEqual(["l4", "l5"]);
  });

  it("dal adı eşleşince dalın tüm modül/dersleri gelir", () => {
    const r = filterCurriculum(CUR, "elektronik");
    expect(r).toHaveLength(1);
    expect(r[0].modules).toHaveLength(2);
  });

  it("Türkçe büyük/küçük harf duyarsız (İ/ı)", () => {
    // "İlk lehim" → "İLK" araması eşleşmeli
    const r = filterCurriculum(CUR, "İLK");
    expect(r[0].modules[0].lessons.map((l) => l.id)).toEqual(["l2"]);
    // "KiCad" → "kicad" eşleşmeli
    expect(filterCurriculum(CUR, "kicad")[0].modules[0].lessons[0].id).toBe("l3");
  });

  it("eşleşme yoksa boş dizi", () => {
    expect(filterCurriculum(CUR, "xyzqwe")).toEqual([]);
  });
});

describe("filterByStatus", () => {
  // l1 done, l2 current, l3 done, l4 todo, l5 done
  const ST: Record<string, LessonStatus> = {
    l1: "done",
    l2: "current",
    l3: "done",
    l4: "todo",
    l5: "done",
  };

  it("all → değişmeden döner", () => {
    expect(filterByStatus(CUR, ST, "all")).toBe(CUR);
  });

  it("done → yalnız tamamlanan dersler, boş modül/dal atılır", () => {
    const r = filterByStatus(CUR, ST, "done");
    const ids = r.flatMap((t) => t.modules.flatMap((m) => m.lessons.map((l) => l.id)));
    expect(ids.sort()).toEqual(["l1", "l3", "l5"]);
    // m1'de yalnız l1 kalır (l2 done değil)
    expect(r[0].modules[0].lessons.map((l) => l.id)).toEqual(["l1"]);
  });

  it("todo → tamamlanmamış (current dahil) dersler", () => {
    const r = filterByStatus(CUR, ST, "todo");
    const ids = r.flatMap((t) => t.modules.flatMap((m) => m.lessons.map((l) => l.id)));
    expect(ids.sort()).toEqual(["l2", "l4"]);
  });

  it("durumu bilinmeyen ders todo sayılır", () => {
    const r = filterByStatus(CUR, {}, "todo");
    const ids = r.flatMap((t) => t.modules.flatMap((m) => m.lessons.map((l) => l.id)));
    expect(ids.sort()).toEqual(["l1", "l2", "l3", "l4", "l5"]);
    // done filtresinde hiçbiri kalmaz
    expect(filterByStatus(CUR, {}, "done")).toEqual([]);
  });
});
