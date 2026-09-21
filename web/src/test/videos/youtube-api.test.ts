import { describe, it, expect, vi } from "vitest";
import { parseIsoDuration, searchVideoIds, fetchVideoDetails, fetchPlaylistVideoIds } from "@/lib/videos/youtube-api";

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

describe("fetchPlaylistVideoIds", () => {
  const page = (ids: string[], next?: string) =>
    ({ ok: true, json: async () => ({ items: ids.map((id) => ({ contentDetails: { videoId: id } })), nextPageToken: next }) }) as Response;

  it("playlist sırasıyla video id'lerini döner", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(page(["a", "b", "c"]));
    const r = await fetchPlaylistVideoIds("PL1", { apiKey: "K", fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toEqual({ ids: ["a", "b", "c"], truncated: false });
    const url = new URL(fetchImpl.mock.calls[0][0] as string);
    expect(url.searchParams.get("playlistId")).toBe("PL1");
    expect(url.searchParams.get("part")).toBe("contentDetails");
  });
  it("sayfaları birleştirir", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(page(["a", "b"], "T2")).mockResolvedValueOnce(page(["c"]));
    const r = await fetchPlaylistVideoIds("PL1", { apiKey: "K", fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toEqual({ ids: ["a", "b", "c"], truncated: false });
    expect(new URL(fetchImpl.mock.calls[1][0] as string).searchParams.get("pageToken")).toBe("T2");
  });
  it("üst sınıra ulaşınca durur ve truncated işaretler", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(page(["a", "b", "c"], "T2"));
    const r = await fetchPlaylistVideoIds("PL1", { apiKey: "K", max: 3, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toEqual({ ids: ["a", "b", "c"], truncated: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it("HTTP hatasında boş döner ve onError çağırır", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 404, text: async () => "notFound" } as Response);
    const onError = vi.fn();
    const r = await fetchPlaylistVideoIds("PL1", { apiKey: "K", fetchImpl: fetchImpl as unknown as typeof fetch, onError });
    expect(r).toEqual({ ids: [], truncated: false });
    expect(onError).toHaveBeenCalled();
  });
});

describe("searchVideoIds: arama parametreleri", () => {
  const ok = (ids: string[]) => ({ ok: true, json: async () => ({ items: ids.map((id) => ({ id: { videoId: id } })) }) }) as Response;
  const paramlar = (fetchImpl: ReturnType<typeof vi.fn>) => new URL(fetchImpl.mock.calls[0][0] as string).searchParams;

  it("varsayılan olarak 25 sonuç ister (çağrı başı kota aynı, aday havuzu geniş)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok(["a"]));
    await searchVideoIds("drone", { apiKey: "K", publishedAfter: "2022-01-01T00:00:00Z", fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(paramlar(fetchImpl).get("maxResults")).toBe("25");
  });
  it("max verilirse onu kullanır", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok(["a"]));
    await searchVideoIds("drone", { apiKey: "K", publishedAfter: "2022-01-01T00:00:00Z", max: 40, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(paramlar(fetchImpl).get("maxResults")).toBe("40");
  });
  it("YouTube'un izin verdiği en fazla 50'yi aşmaz", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok(["a"]));
    await searchVideoIds("drone", { apiKey: "K", publishedAfter: "2022-01-01T00:00:00Z", max: 500, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(paramlar(fetchImpl).get("maxResults")).toBe("50");
  });
  it("gömülemeyen videoları kaynağında eler (videoEmbeddable=true)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok(["a"]));
    await searchVideoIds("drone", { apiKey: "K", publishedAfter: "2022-01-01T00:00:00Z", fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(paramlar(fetchImpl).get("videoEmbeddable")).toBe("true");
  });
});
