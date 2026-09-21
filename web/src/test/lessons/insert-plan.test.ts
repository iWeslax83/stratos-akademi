import { describe, it, expect } from "vitest";
import { planLessonInsert } from "@/lib/lessons/insert-plan";
import type { VideoDetail } from "@/lib/videos/types";

function v(id: string, baslik: string, sure = 600): VideoDetail {
  return {
    youtube_video_id: id, baslik, aciklama: "uzun reklam metni", kanal: "K", sure_sn: sure,
    izlenme: 1, yayin_tarihi: "2025-01-01T00:00:00Z", embeddable: true, blockedInTR: false, isLiveRemnant: false,
  };
}

describe("planLessonInsert", () => {
  it("sırayı modülün son sırası + 1'den başlatır, süreyi videodan alır", () => {
    const rows = planLessonInsert("m1", 4, [{ detail: v("aaaaaaaaaaa", "Bir") }, { detail: v("bbbbbbbbbbb", "İki", 90) }]);
    expect(rows).toEqual([
      { module_id: "m1", baslik: "Bir", youtube_video_id: "aaaaaaaaaaa", aciklama: null, sure_sn: 600, sira: 5 },
      { module_id: "m1", baslik: "İki", youtube_video_id: "bbbbbbbbbbb", aciklama: null, sure_sn: 90, sira: 6 },
    ]);
  });
  it("modül boşsa (son sıra null) 0'dan başlar", () => {
    expect(planLessonInsert("m1", null, [{ detail: v("aaaaaaaaaaa", "Bir") }])[0].sira).toBe(0);
  });
  it("başlık override'ı kullanılır; boş ya da boşluk ise YouTube başlığına düşer", () => {
    const rows = planLessonInsert("m1", null, [
      { detail: v("aaaaaaaaaaa", "Bir"), baslik: "  Özel  " },
      { detail: v("bbbbbbbbbbb", "İki"), baslik: "   " },
    ]);
    expect(rows.map((r) => r.baslik)).toEqual(["Özel", "İki"]);
  });
  it("açıklama her zaman null (YouTube açıklaması kopyalanmaz)", () => {
    expect(planLessonInsert("m1", null, [{ detail: v("aaaaaaaaaaa", "Bir") }])[0].aciklama).toBeNull();
  });
});
