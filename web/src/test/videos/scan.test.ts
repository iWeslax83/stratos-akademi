import { describe, it, expect, vi } from "vitest";
import { runVideoScan } from "@/lib/videos/scan";
import type { ScanPorts, VideoDetail, PendingRow } from "@/lib/videos/types";

function vd(id: string): VideoDetail {
  return {
    youtube_video_id: id, baslik: "Drone dersi", aciklama: "Türkçe anlatım", kanal: "K",
    sure_sn: 600, izlenme: 50000, yayin_tarihi: "2024-01-01T00:00:00Z",
    embeddable: true, blockedInTR: false, isLiveRemnant: false,
  };
}

function ports(over: Partial<ScanPorts> = {}): ScanPorts {
  return {
    now: new Date("2026-07-01T00:00:00Z"),
    maxCandidates: 20,
    getCurriculum: async () => ({
      tracks: [{ id: "t1", ad: "Yazılım" }],
      modules: [{ id: "m1", track_id: "t1", ad: "Temel" }],
    }),
    getExistingIds: async () => new Set<string>(),
    searchVideoIds: async () => ["aaa", "bbb"],
    fetchVideoDetails: async () => [vd("aaa"), vd("bbb")],
    classify: async (v) => ({ uygun: true, module_id: "m1", skor: 80, gerekce: "ok:" + v.youtube_video_id }),
    insertPending: vi.fn(async () => {}),
    prune: async () => 0,
    notifyAdmins: vi.fn(async () => {}),
    ...over,
  };
}

describe("runVideoScan", () => {
  it("uygun adayları pending olarak yazar ve admin bildirir", async () => {
    const insertPending = vi.fn(async (_rows: PendingRow[]) => {});
    const notifyAdmins = vi.fn(async () => {});
    const summary = await runVideoScan(ports({ insertPending, notifyAdmins }));
    expect(insertPending).toHaveBeenCalledOnce();
    const rows = insertPending.mock.calls[0][0];
    expect(rows).toHaveLength(2);
    expect(rows[0].durum).toBe("pending");
    expect(notifyAdmins).toHaveBeenCalledWith(2);
    expect(summary).toMatchObject({ eklenen: 2 });
  });

  it("modül yoksa erken çıkar", async () => {
    const searchVideoIds = vi.fn(async () => ["x"]);
    const summary = await runVideoScan(ports({
      getCurriculum: async () => ({ tracks: [], modules: [] }),
      searchVideoIds,
    }));
    expect(searchVideoIds).not.toHaveBeenCalled();
    expect(summary).toEqual({ taranan: 0, aday: 0, eklenen: 0, budanan: 0 });
  });

  it("uygun aday yoksa bildirmez ama budamayı yapar", async () => {
    const notifyAdmins = vi.fn(async () => {});
    const summary = await runVideoScan(ports({
      classify: async () => ({ uygun: false, module_id: null, skor: 0, gerekce: "" }),
      prune: async () => 3,
      notifyAdmins,
    }));
    expect(notifyAdmins).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ eklenen: 0, budanan: 3 });
  });

  it("aday sayısını maxCandidates ile sınırlar", async () => {
    const many = Array.from({ length: 40 }, (_, k) => "v" + k);
    const insertPending = vi.fn(async (_rows: PendingRow[]) => {});
    await runVideoScan(ports({
      maxCandidates: 5,
      searchVideoIds: async () => many,
      fetchVideoDetails: async () => many.map(vd),
      insertPending,
    }));
    expect(insertPending.mock.calls[0][0].length).toBe(5);
  });
});
