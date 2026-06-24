import { describe, it, expect } from "vitest";
import { attachSubmissionsToTasks, mapPendingRows } from "@/lib/tasks/shape";
import type { PracticalTask } from "@/lib/tasks/queries";

const tasks: PracticalTask[] = [
  { id: "t1", baslik: "Görev 1", aciklama: null, sira: 1, puan: 10 },
  { id: "t2", baslik: "Görev 2", aciklama: null, sira: 2, puan: 20 },
];

describe("attachSubmissionsToTasks", () => {
  it("gönderimi olmayan görevler → submission null", () => {
    const out = attachSubmissionsToTasks(tasks, []);
    expect(out).toHaveLength(2);
    expect(out.every((m) => m.submission === null)).toBe(true);
  });

  it("gönderimi doğru göreve bağlar, task_id'yi çıkarır", () => {
    const out = attachSubmissionsToTasks(tasks, [
      { id: "s1", task_id: "t2", icerik: "link", durum: "beklemede", geri_bildirim: null, dosya_yolu: null },
    ]);
    expect(out[0].submission).toBeNull();
    expect(out[1].submission?.id).toBe("s1");
    expect(out[1].submission).not.toHaveProperty("task_id");
  });
});

describe("mapPendingRows", () => {
  const emailById = new Map([["u1", "uye@okul.edu.tr"]]);

  it("iç içe join alanlarını düzleştirir", () => {
    const out = mapPendingRows(
      [
        {
          id: "s1",
          icerik: "link",
          created_at: "2026-06-01T00:00:00Z",
          user_id: "u1",
          dosya_yolu: null,
          practical_tasks: { baslik: "Lehim", modules: { ad: "Modül A", tracks: { ad: "Elektronik" } } },
        },
      ],
      emailById,
    );
    expect(out[0]).toMatchObject({
      taskBaslik: "Lehim",
      modulAd: "Modül A",
      trackAd: "Elektronik",
      uyeEmail: "uye@okul.edu.tr",
    });
  });

  it("eksik iç içe alanlar/email → güvenli fallback", () => {
    const out = mapPendingRows(
      [
        {
          id: "s2",
          icerik: "",
          created_at: "2026-06-01T00:00:00Z",
          user_id: "yok",
          dosya_yolu: null,
          practical_tasks: null,
        },
      ],
      emailById,
    );
    expect(out[0].taskBaslik).toBe("(görev)");
    expect(out[0].modulAd).toBe("");
    expect(out[0].trackAd).toBe("");
    expect(out[0].uyeEmail).toBe("(üye)");
  });

  it("modül var ama track null → trackAd boş", () => {
    const out = mapPendingRows(
      [
        {
          id: "s3",
          icerik: "",
          created_at: "2026-06-01T00:00:00Z",
          user_id: "u1",
          dosya_yolu: null,
          practical_tasks: { baslik: "X", modules: { ad: "M", tracks: null } },
        },
      ],
      emailById,
    );
    expect(out[0].modulAd).toBe("M");
    expect(out[0].trackAd).toBe("");
  });
});
