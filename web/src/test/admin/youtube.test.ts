import { describe, it, expect } from "vitest";
import { parseYouTubeId, parseYouTubeInput } from "@/lib/admin/youtube";

describe("parseYouTubeId", () => {
  it("watch?v= URL'sinden id çıkarır", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("youtu.be kısa linkinden", () => {
    expect(parseYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("embed ve shorts'tan", () => {
    expect(parseYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("ekstra parametrelerle", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s")).toBe("dQw4w9WgXcQ");
  });
  it("çıplak 11-hane id olduğu gibi döner", () => {
    expect(parseYouTubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("geçersiz girdi null", () => {
    expect(parseYouTubeId("merhaba dünya")).toBeNull();
    expect(parseYouTubeId("")).toBeNull();
  });
});

describe("parseYouTubeInput", () => {
  it("video linkini video olarak tanır", () => {
    expect(parseYouTubeInput("https://youtu.be/dQw4w9WgXcQ")).toEqual({ tur: "video", id: "dQw4w9WgXcQ" });
    expect(parseYouTubeInput("dQw4w9WgXcQ")).toEqual({ tur: "video", id: "dQw4w9WgXcQ" });
  });
  it("yalnız list= içeren linki playlist sayar", () => {
    expect(parseYouTubeInput("https://www.youtube.com/playlist?list=PLabc123_-XYZ")).toEqual({
      tur: "playlist",
      id: "PLabc123_-XYZ",
    });
  });
  it("v= ve list= birlikteyse video sayar, playlistId'yi taşır", () => {
    expect(
      parseYouTubeInput("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabc123_-XYZ&index=3"),
    ).toEqual({ tur: "video", id: "dQw4w9WgXcQ", playlistId: "PLabc123_-XYZ" });
  });
  it("YouTube Mix (RD) listesini playlist saymaz; videoda playlistId taşımaz", () => {
    expect(parseYouTubeInput("https://www.youtube.com/playlist?list=RDdQw4w9WgXcQ")).toBeNull();
    expect(parseYouTubeInput("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ")).toEqual({
      tur: "video",
      id: "dQw4w9WgXcQ",
    });
  });
  it("izleme listesi (WL) ve beğenilenler (LL) desteklenmez", () => {
    expect(parseYouTubeInput("https://www.youtube.com/playlist?list=WL")).toBeNull();
    expect(parseYouTubeInput("https://www.youtube.com/playlist?list=LL")).toBeNull();
  });
  it("geçersiz ya da boş girdi null", () => {
    expect(parseYouTubeInput("merhaba")).toBeNull();
    expect(parseYouTubeInput("   ")).toBeNull();
  });
  it("kenardaki boşlukları yok sayar", () => {
    expect(parseYouTubeInput("  https://youtu.be/dQw4w9WgXcQ \n")).toEqual({ tur: "video", id: "dQw4w9WgXcQ" });
  });
});
