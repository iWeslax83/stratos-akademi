import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TrackIcon, resolveTrackIcon, TRACK_IKONLAR } from "@/components/ui/TrackIcon";

describe("resolveTrackIcon", () => {
  it("dalın slug'ından ikonu bulur", () => {
    expect(resolveTrackIcon("ortak-temel", null)).toBe("layers");
    expect(resolveTrackIcon("aviyonik", null)).toBe("chip");
    expect(resolveTrackIcon("yazilim", null)).toBe("code");
    expect(resolveTrackIcon("mekanik", null)).toBe("cog");
    expect(resolveTrackIcon("pilot", null)).toBe("controller");
    expect(resolveTrackIcon("tanitim-sponsorluk", null)).toBe("megaphone");
  });
  it("eski slug'lar (elektronik, tasarim) yeni ikona düşer", () => {
    expect(resolveTrackIcon("elektronik", null)).toBe("chip");
    expect(resolveTrackIcon("tasarim", null)).toBe("cog");
  });
  it("slug yoksa DB'deki eski emojiyi ikona çevirir", () => {
    expect(resolveTrackIcon(undefined, "🚀")).toBe("layers");
    expect(resolveTrackIcon(undefined, "⚡")).toBe("chip");
    expect(resolveTrackIcon(undefined, "💻")).toBe("code");
    expect(resolveTrackIcon(undefined, "🏗️")).toBe("cog");
    expect(resolveTrackIcon(undefined, "🎮")).toBe("controller");
    expect(resolveTrackIcon(undefined, "📣")).toBe("megaphone");
  });
  it("ikon alanı doğrudan bir anahtarsa onu kullanır ve slug'a tercih eder", () => {
    expect(resolveTrackIcon("yazilim", "megaphone")).toBe("megaphone");
  });
  it("bilinmeyen slug ve emoji için nokta", () => {
    expect(resolveTrackIcon("yeni-dal", "🦄")).toBe("dot");
    expect(resolveTrackIcon(undefined, null)).toBe("dot");
  });
  it("seçim listesindeki her anahtar çözülür", () => {
    for (const { key } of TRACK_IKONLAR) expect(resolveTrackIcon(undefined, key)).toBe(key);
  });
});

describe("TrackIcon", () => {
  it("aria-hidden SVG çizer ve hangi ikon olduğunu data-icon ile işaretler", () => {
    const { container } = render(<TrackIcon slug="yazilim" ikon="💻" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("data-icon", "code");
    expect(container).not.toHaveTextContent("💻");
  });
});
