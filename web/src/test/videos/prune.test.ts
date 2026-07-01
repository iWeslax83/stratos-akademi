import { describe, it, expect } from "vitest";
import { computePrune, type RejectedRow } from "@/lib/videos/prune";

const now = new Date("2026-07-01T00:00:00Z");
function row(i: number, daysAgo: number): RejectedRow {
  const at = new Date(now.getTime() - daysAgo * 24 * 3600 * 1000).toISOString();
  return { id: `id${i}`, youtube_video_id: `vid${i}`, rejected_at: at };
}

describe("computePrune", () => {
  it("1 aydan eskiyi siler ve kara listeye yazar", () => {
    const rows = [row(1, 40), row(2, 10)];
    const r = computePrune(rows, now);
    expect(r.deleteIds).toEqual(["id1"]);
    expect(r.blacklistVideoIds).toEqual(["vid1"]);
  });

  it("en yeni 30'un dışını siler", () => {
    const rows = Array.from({ length: 35 }, (_, k) => row(k, k)); // k gün önce
    const r = computePrune(rows, now);
    // 30 gün ve üzeri zaten yaş kuralına takılır; 30'dan yeni ama 30. sıradan sonrakiler de silinir
    expect(r.deleteIds).toContain("id34");
    expect(r.deleteIds).toContain("id30");
    expect(r.deleteIds).not.toContain("id0");
  });

  it("30'dan az ve hepsi taze ise hiçbirini silmez", () => {
    const rows = Array.from({ length: 10 }, (_, k) => row(k, 1));
    expect(computePrune(rows, now).deleteIds).toEqual([]);
  });
});
