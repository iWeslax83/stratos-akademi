import { describe, it, expect } from "vitest";
import { passesFilter, mechanicalFilter } from "@/lib/videos/filter";
import type { VideoDetail, FilterOpts } from "@/lib/videos/types";

const now = new Date("2026-07-01T00:00:00Z");
const base: VideoDetail = {
  youtube_video_id: "aaaaaaaaaaa",
  baslik: "Quadcopter PID ayarı nasıl yapılır",
  aciklama: "Türkçe anlatım",
  kanal: "Kanal",
  sure_sn: 600,
  izlenme: 50000,
  yayin_tarihi: "2024-01-01T00:00:00Z",
  embeddable: true,
  blockedInTR: false,
  isLiveRemnant: false,
};
const opts: FilterOpts = {
  now,
  minViews: 10000,
  minDurationSn: 180,
  maxAgeYears: 4,
  existingIds: new Set(),
};

describe("passesFilter", () => {
  it("temiz videoyu geçirir", () => {
    expect(passesFilter(base, opts)).toBe(true);
  });
  it("10.000 altını eler", () => {
    expect(passesFilter({ ...base, izlenme: 9999 }, opts)).toBe(false);
  });
  it("180 sn altını eler", () => {
    expect(passesFilter({ ...base, sure_sn: 120 }, opts)).toBe(false);
  });
  it("4 yıldan eskiyi eler", () => {
    expect(passesFilter({ ...base, yayin_tarihi: "2021-06-01T00:00:00Z" }, opts)).toBe(false);
  });
  it("canlı yayın kalıntısını eler", () => {
    expect(passesFilter({ ...base, isLiveRemnant: true }, opts)).toBe(false);
  });
  it("gömülemeyeni eler", () => {
    expect(passesFilter({ ...base, embeddable: false }, opts)).toBe(false);
  });
  it("TR'de engelliyi eler", () => {
    expect(passesFilter({ ...base, blockedInTR: true }, opts)).toBe(false);
  });
  it("TR/EN dışı dili eler", () => {
    expect(passesFilter({ ...base, baslik: "クアッドコプターの作り方", aciklama: "" }, opts)).toBe(false);
  });
  it("mevcut id'yi eler (dedup)", () => {
    const o = { ...opts, existingIds: new Set(["aaaaaaaaaaa"]) };
    expect(passesFilter(base, o)).toBe(false);
  });
});

describe("mechanicalFilter", () => {
  it("yalnız geçenleri döner ve batch içi tekrarları eler", () => {
    const dup = { ...base };
    const bad = { ...base, youtube_video_id: "bbbbbbbbbbb", izlenme: 100 };
    const out = mechanicalFilter([base, dup, bad], opts);
    expect(out.map((v) => v.youtube_video_id)).toEqual(["aaaaaaaaaaa"]);
  });
});
