import { describe, expect, it } from "vitest";
import { tamGorunenAd } from "@/lib/dashboard/leaderboard";

describe("tamGorunenAd", () => {
  it("tam ad varsa onu döner", () => {
    expect(tamGorunenAd("Emir Sakarya", "Emir S.")).toBe("Emir Sakarya");
  });
  it("boşlukları kırpar", () => {
    expect(tamGorunenAd("  Emir Sakarya ", "Emir S.")).toBe("Emir Sakarya");
  });
  it("tam ad yoksa veya boşsa RPC adına düşer", () => {
    expect(tamGorunenAd(null, "Üye")).toBe("Üye");
    expect(tamGorunenAd("   ", "Üye")).toBe("Üye");
  });
});
