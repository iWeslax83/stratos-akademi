import { describe, it, expect } from "vitest";
import { parseYouTubeId } from "@/lib/admin/youtube";

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
