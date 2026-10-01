import { describe, it, expect } from "vitest";
import { earnedTrackSlugs } from "@/lib/dashboard/sync-competencies";
import type { Curriculum } from "@/lib/curriculum/types";

const lesson = (id: string) => ({ id, baslik: id, youtube_video_id: "x", aciklama: null, sure_sn: 60, sira: 1 });
const track = (slug: string, ids: string[]) => ({
  id: slug, slug, ad: slug, aciklama: null, ikon: null, sira: 1,
  modules: [{ id: `${slug}-m`, ad: "m", aciklama: null, sira: 1, quiz: null, lessons: ids.map(lesson) }],
});

describe("earnedTrackSlugs", () => {
  const cur = [track("a", ["1", "2"]), track("b", ["3"]), track("bos", [])] as unknown as Curriculum;
  it("tüm dersleri biten dalı kazanılmış sayar", () => {
    expect(earnedTrackSlugs(cur, new Set(["1", "2"]))).toEqual(["a"]);
  });
  it("eksik ders varsa kazanılmaz", () => {
    expect(earnedTrackSlugs(cur, new Set(["1", "3"]))).toEqual(["b"]);
  });
  it("dersi olmayan dal sayılmaz", () => {
    expect(earnedTrackSlugs(cur, new Set())).toEqual([]);
  });
});
