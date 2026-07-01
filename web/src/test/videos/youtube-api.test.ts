import { describe, it, expect, vi } from "vitest";
import { parseIsoDuration, searchVideoIds, fetchVideoDetails } from "@/lib/videos/youtube-api";

describe("parseIsoDuration", () => {
  it("PT10M30S -> 630", () => expect(parseIsoDuration("PT10M30S")).toBe(630));
  it("PT1H2M3S -> 3723", () => expect(parseIsoDuration("PT1H2M3S")).toBe(3723));
  it("PT45S -> 45", () => expect(parseIsoDuration("PT45S")).toBe(45));
  it("bozuk -> 0", () => expect(parseIsoDuration("abc")).toBe(0));
});

describe("searchVideoIds", () => {
  it("arama sonucundan video id'leri toplar", async () => {
    const body = { items: [{ id: { videoId: "aaa" } }, { id: { videoId: "bbb" } }] };
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => body } as Response);
    const ids = await searchVideoIds("drone", {
      apiKey: "K", publishedAfter: "2022-01-01T00:00:00Z", fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(ids).toEqual(["aaa", "bbb"]);
  });
  it("HTTP hatasında boş dizi döner", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => "quota" } as Response);
    const ids = await searchVideoIds("x", {
      apiKey: "K", publishedAfter: "2022-01-01T00:00:00Z", fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(ids).toEqual([]);
  });
});

describe("fetchVideoDetails", () => {
  it("videos.list yanıtını VideoDetail'e normalize eder", async () => {
    const body = {
      items: [
        {
          id: "aaa",
          snippet: { title: "Başlık", description: "Açıklama", channelTitle: "Kanal", publishedAt: "2024-01-01T00:00:00Z" },
          contentDetails: { duration: "PT10M", regionRestriction: { blocked: ["TR"] } },
          statistics: { viewCount: "12345" },
          status: { embeddable: true },
        },
      ],
    };
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => body } as Response);
    const out = await fetchVideoDetails(["aaa"], { apiKey: "K", fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(out[0]).toMatchObject({
      youtube_video_id: "aaa", baslik: "Başlık", kanal: "Kanal",
      sure_sn: 600, izlenme: 12345, embeddable: true, blockedInTR: true, isLiveRemnant: false,
    });
  });
  it("boş id listesinde çağrı yapmaz", async () => {
    const fetchImpl = vi.fn();
    const out = await fetchVideoDetails([], { apiKey: "K", fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(out).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
