import { describe, it, expect, vi } from "vitest";
import { parseClassification, geminiClassify } from "@/lib/videos/classify";
import type { VideoDetail, ModuleRow } from "@/lib/videos/types";

const valid = new Set(["m1", "m2"]);

describe("parseClassification", () => {
  it("geçerli JSON'u ayrıştırır", () => {
    const raw = JSON.stringify({ uygun: true, module_id: "m1", skor: 80, gerekce: "Uyumlu" });
    expect(parseClassification(raw, valid)).toEqual({ uygun: true, module_id: "m1", skor: 80, gerekce: "Uyumlu" });
  });
  it("geçersiz module_id'yi uygun=false yapar", () => {
    const raw = JSON.stringify({ uygun: true, module_id: "yok", skor: 90, gerekce: "x" });
    expect(parseClassification(raw, valid)?.uygun).toBe(false);
  });
  it("skoru 0-100'e sıkıştırır", () => {
    const raw = JSON.stringify({ uygun: true, module_id: "m1", skor: 250, gerekce: "x" });
    expect(parseClassification(raw, valid)?.skor).toBe(100);
  });
  it("bozuk çıktıya null döner", () => {
    expect(parseClassification("bu json değil", valid)).toBeNull();
  });
  it("kod bloğu sarmalını temizler", () => {
    const raw = "```json\n{\"uygun\":false,\"module_id\":null,\"skor\":0,\"gerekce\":\"Alakasız\"}\n```";
    expect(parseClassification(raw, valid)?.gerekce).toBe("Alakasız");
  });
});

describe("geminiClassify", () => {
  const v: VideoDetail = {
    youtube_video_id: "x", baslik: "b", aciklama: "a", kanal: "k",
    sure_sn: 600, izlenme: 20000, yayin_tarihi: "2024-01-01T00:00:00Z",
    embeddable: true, blockedInTR: false, isLiveRemnant: false,
  };
  const modules: ModuleRow[] = [{ id: "m1", track_id: "t1", ad: "Temel" }];

  it("Gemini yanıtını ayrıştırıp döner", async () => {
    const body = { candidates: [{ content: { parts: [{ text: JSON.stringify({ uygun: true, module_id: "m1", skor: 70, gerekce: "ok" }) }] } }] };
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => body } as Response);
    const r = await geminiClassify(v, modules, { apiKey: "K", fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r?.module_id).toBe("m1");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("HTTP hatasında null döner", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 429, text: async () => "quota" } as Response);
    const r = await geminiClassify(v, modules, { apiKey: "K", fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toBeNull();
  });
});

describe("model zinciri", () => {
  const v: VideoDetail = {
    youtube_video_id: "x", baslik: "b", aciklama: "a", kanal: "k",
    sure_sn: 600, izlenme: 20000, yayin_tarihi: "2024-01-01T00:00:00Z",
    embeddable: true, blockedInTR: false, isLiveRemnant: false,
  };
  const modules: ModuleRow[] = [{ id: "m1", track_id: "t1", ad: "Temel" }];
  const iyiYanit = {
    ok: true,
    json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ uygun: true, module_id: "m1", skor: 70, gerekce: "ok" }) }] } }] }),
  } as Response;
  const olu = (status: number) => ({ ok: false, status, json: async () => ({ error: { message: "yok" } }) } as Response);

  it("404 alınca zincirdeki sonraki modele düşer", async () => {
    // Asıl arıza buydu: sabit model 404 dönüyordu ve tüm sınıflandırmalar null oluyordu.
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(olu(404))
      .mockResolvedValueOnce(iyiYanit);
    const r = await geminiClassify(v, modules, {
      apiKey: "K", models: ["olu-model", "calisan-model"],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(r?.uygun).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(String(fetchImpl.mock.calls[1][0])).toContain("calisan-model");
  });

  it("kota (429) da modeli ölü sayar", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(olu(429)).mockResolvedValueOnce(iyiYanit);
    const r = await geminiClassify(v, modules, {
      apiKey: "K", models: ["kotasi-dolu", "calisan-model"],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(r?.uygun).toBe(true);
  });

  it("ölü model bir sonraki videoda tekrar denenmez", async () => {
    const oluModeller = new Set<string>();
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(olu(404))   // 1. video: ilk model ölür
      .mockResolvedValueOnce(iyiYanit)   // 1. video: ikinci model çalışır
      .mockResolvedValueOnce(iyiYanit);  // 2. video: doğrudan ikinci modele gider
    const deps = {
      apiKey: "K", models: ["olu-model", "calisan-model"], oluModeller,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    };
    await geminiClassify(v, modules, deps);
    await geminiClassify(v, modules, deps);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(String(fetchImpl.mock.calls[2][0])).toContain("calisan-model");
  });

  it("tüm modeller ölüyse null döner ve hata raporlar", async () => {
    const hatalar: string[] = [];
    const fetchImpl = vi.fn().mockResolvedValue(olu(404));
    const r = await geminiClassify(v, modules, {
      apiKey: "K", models: ["a", "b"],
      onError: (m) => hatalar.push(m),
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(r).toBeNull();
    expect(hatalar).toHaveLength(2);
    expect(hatalar[0]).toContain("HTTP 404");
  });
});
