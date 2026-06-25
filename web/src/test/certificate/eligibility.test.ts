import { describe, it, expect } from "vitest";
import { certificateFor, earnedCertificates, type CertTrack } from "@/lib/certificate/eligibility";

const TRACKS: CertTrack[] = [
  { slug: "temel", ad: "Ortak Temel", ikon: "🛠️" },
  { slug: "elektronik", ad: "Elektronik", ikon: "⚡" },
  { slug: "yazilim", ad: "Yazılım", ikon: "💻" },
];

describe("certificateFor", () => {
  it("hak edilen dal için dal bilgisini döner", () => {
    expect(certificateFor(TRACKS, ["elektronik"], "elektronik")).toEqual({
      slug: "elektronik",
      ad: "Elektronik",
      ikon: "⚡",
    });
  });

  it("hak edilmeyen dal → null", () => {
    expect(certificateFor(TRACKS, ["elektronik"], "yazilim")).toBeNull();
  });

  it("bilinmeyen slug (hak edilmiş görünse de katalogda yok) → null", () => {
    expect(certificateFor(TRACKS, ["yok"], "yok")).toBeNull();
  });
});

describe("earnedCertificates", () => {
  it("yalnız hak edilenleri, dal sırasını koruyarak döner", () => {
    const r = earnedCertificates(TRACKS, ["yazilim", "temel"]);
    expect(r.map((t) => t.slug)).toEqual(["temel", "yazilim"]);
  });

  it("hiç hak edilmemişse boş", () => {
    expect(earnedCertificates(TRACKS, [])).toEqual([]);
  });
});
