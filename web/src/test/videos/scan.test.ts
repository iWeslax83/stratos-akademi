import { describe, it, expect, vi } from "vitest";
import { runVideoScan } from "@/lib/videos/scan";
import type { ScanPorts, VideoDetail, PendingRow, ScanSummary } from "@/lib/videos/types";

function vd(id: string): VideoDetail {
  return {
    youtube_video_id: id, baslik: "Drone dersi", aciklama: "Türkçe anlatım", kanal: "Kanal-" + id,
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
    expect(summary).toMatchObject({ taranan: 0, aday: 0, eklenen: 0, budanan: 0 });
  });

  it("mekanik elemeyi neden bazında sayar (teşhis hunisi)", async () => {
    const kisa = { ...vd("kisa"), sure_sn: 30 };
    const azIzlenme = { ...vd("az"), izlenme: 5 };
    const eski = { ...vd("eski"), yayin_tarihi: "2010-01-01T00:00:00Z" };
    const summary = await runVideoScan(ports({
      searchVideoIds: async () => ["ok", "kisa", "az", "eski"],
      fetchVideoDetails: async () => [vd("ok"), kisa, azIzlenme, eski],
    }));
    expect(summary.diag.detay_cekilen).toBe(4);
    expect(summary.diag.eleme).toMatchObject({ kisa_sure: 1, az_izlenme: 1, eski: 1 });
    expect(summary.diag.filtreden_gecen).toBe(1);
    expect(summary.eklenen).toBe(1);
  });

  it("Gemini uygunsuz/hata sonuçlarını ayrı sayar", async () => {
    let n = 0;
    const summary = await runVideoScan(ports({
      classify: async () => {
        n += 1;
        if (n === 1) return null; // API hatası
        return { uygun: false, module_id: null, skor: 0, gerekce: "" };
      },
    }));
    expect(summary.diag.siniflandirilan).toBe(2);
    expect(summary.diag.gemini_hata).toBe(1);
    expect(summary.diag.gemini_uygunsuz).toBe(1);
    expect(summary.diag.gemini_uygun).toBe(0);
    expect(summary.eklenen).toBe(0);
  });

  it("koşuyu hatalarıyla birlikte kaydeder", async () => {
    const recordRun = vi.fn(async () => {});
    await runVideoScan(ports({ recordRun, getErrors: () => ["YouTube search HTTP 403: quotaExceeded"] }));
    expect(recordRun).toHaveBeenCalledOnce();
    const [summary, hata] = recordRun.mock.calls[0] as unknown as [ScanSummary, string | null];
    expect(hata).toBeNull();
    expect(summary.diag.hatalar).toEqual(["YouTube search HTTP 403: quotaExceeded"]);
  });

  it("modül yoksa koşuyu hata sebebiyle kaydeder", async () => {
    const recordRun = vi.fn(async () => {});
    await runVideoScan(ports({ getCurriculum: async () => ({ tracks: [], modules: [] }), recordRun }));
    const [, hata] = recordRun.mock.calls[0] as unknown as [ScanSummary, string | null];
    expect(hata).toBe("müfredatta modül yok");
  });

  it("modülün track'i yoksa sorgu üretemez ve bunu hata olarak kaydeder", async () => {
    const recordRun = vi.fn(async () => {});
    const summary = await runVideoScan(ports({
      getCurriculum: async () => ({ tracks: [], modules: [{ id: "m1", track_id: "yok", ad: "Temel" }] }),
      recordRun,
    }));
    expect(summary.diag.sorgu_sayisi).toBe(0);
    const [, hata] = recordRun.mock.calls[0] as unknown as [ScanSummary, string | null];
    expect(hata).toContain("arama sorgusu");
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

  it("kalite kapısı düşük skorluyu eler ve huniye yazar", async () => {
    const insertPending = vi.fn(async (_rows: PendingRow[]) => {});
    const summary = await runVideoScan(ports({
      insertPending,
      kalite: { minSkor: 70, modulBasinaMax: 3 },
      classify: async (v) => ({
        uygun: true, module_id: "m1",
        skor: v.youtube_video_id === "aaa" ? 90 : 40, // bbb eşiğin altında
        gerekce: "",
      }),
    }));
    expect(insertPending.mock.calls[0][0]).toHaveLength(1);
    expect(summary.diag.kalite_eleme.dusuk_skor).toBe(1);
    expect(summary.eklenen).toBe(1);
  });

  it("modülde zaten bekleyen öneri varsa sınırı ona göre uygular", async () => {
    const insertPending = vi.fn(async (_rows: PendingRow[]) => {});
    const summary = await runVideoScan(ports({
      insertPending,
      kalite: { minSkor: 70, modulBasinaMax: 2 },
      getPendingCountsByModule: async () => ({ m1: 2 }), // m1 kuyruğu zaten dolu
    }));
    expect(insertPending).not.toHaveBeenCalled();
    expect(summary.diag.kalite_eleme.modul_dolu).toBe(2);
    expect(summary.eklenen).toBe(0);
  });

  it("aday sayısını maxCandidates ile sınırlar", async () => {
    const many = Array.from({ length: 40 }, (_, k) => "v" + k);
    const insertPending = vi.fn(async (_rows: PendingRow[]) => {});
    await runVideoScan(ports({
      maxCandidates: 5,
      kalite: null, // kalite kapısı kapalı: burada yalnız maxCandidates kesimi test ediliyor
      searchVideoIds: async () => many,
      fetchVideoDetails: async () => many.map(vd),
      insertPending,
    }));
    expect(insertPending.mock.calls[0][0].length).toBe(5);
  });
});
