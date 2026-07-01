import type { VideoDetail } from "@/lib/videos/types";

const SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";

export function parseIsoDuration(iso: string): number {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? "");
  if (!m) return 0;
  const [, h, min, s] = m;
  return (parseInt(h ?? "0", 10) * 3600) + (parseInt(min ?? "0", 10) * 60) + parseInt(s ?? "0", 10);
}

export async function searchVideoIds(
  query: string,
  deps: { apiKey: string; publishedAfter: string; max?: number; fetchImpl?: typeof fetch },
): Promise<string[]> {
  const f = deps.fetchImpl ?? fetch;
  const url = new URL(SEARCH_URL);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("order", "relevance");
  url.searchParams.set("maxResults", String(deps.max ?? 10));
  url.searchParams.set("q", query);
  url.searchParams.set("publishedAfter", deps.publishedAfter);
  url.searchParams.set("key", deps.apiKey);
  try {
    const res = await f(url.toString());
    if (!res.ok) {
      console.error("searchVideoIds HTTP", res.status);
      return [];
    }
    const data = (await res.json()) as { items?: { id?: { videoId?: string } }[] };
    return (data.items ?? []).map((it) => it.id?.videoId).filter((x): x is string => !!x);
  } catch (e) {
    console.error("searchVideoIds:", e);
    return [];
  }
}

type VideoItem = {
  id: string;
  snippet?: { title?: string; description?: string; channelTitle?: string; publishedAt?: string; liveBroadcastContent?: string };
  contentDetails?: { duration?: string; regionRestriction?: { blocked?: string[] } };
  statistics?: { viewCount?: string };
  status?: { embeddable?: boolean };
  liveStreamingDetails?: unknown;
};

function normalize(it: VideoItem): VideoDetail {
  const blocked = it.contentDetails?.regionRestriction?.blocked ?? [];
  return {
    youtube_video_id: it.id,
    baslik: it.snippet?.title ?? "",
    aciklama: it.snippet?.description ?? "",
    kanal: it.snippet?.channelTitle ?? "",
    sure_sn: parseIsoDuration(it.contentDetails?.duration ?? ""),
    izlenme: parseInt(it.statistics?.viewCount ?? "0", 10),
    yayin_tarihi: it.snippet?.publishedAt ?? "",
    embeddable: it.status?.embeddable !== false,
    blockedInTR: blocked.includes("TR"),
    isLiveRemnant: it.liveStreamingDetails != null || (it.snippet?.liveBroadcastContent ?? "none") !== "none",
  };
}

export async function fetchVideoDetails(
  ids: string[],
  deps: { apiKey: string; fetchImpl?: typeof fetch },
): Promise<VideoDetail[]> {
  if (ids.length === 0) return [];
  const f = deps.fetchImpl ?? fetch;
  const out: VideoDetail[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = new URL(VIDEOS_URL);
    url.searchParams.set("part", "snippet,contentDetails,statistics,status,liveStreamingDetails");
    url.searchParams.set("id", batch.join(","));
    url.searchParams.set("key", deps.apiKey);
    try {
      const res = await f(url.toString());
      if (!res.ok) {
        console.error("fetchVideoDetails HTTP", res.status);
        continue;
      }
      const data = (await res.json()) as { items?: VideoItem[] };
      for (const it of data.items ?? []) out.push(normalize(it));
    } catch (e) {
      console.error("fetchVideoDetails:", e);
    }
  }
  return out;
}
