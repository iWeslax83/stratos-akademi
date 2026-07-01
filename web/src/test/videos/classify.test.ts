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
