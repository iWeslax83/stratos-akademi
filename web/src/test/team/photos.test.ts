import { describe, it, expect, vi, afterEach } from "vitest";
import { normalizeName, buildPhotoMap, fetchTeamPhotos } from "@/lib/team/photos";

const SITE = {
  team: {
    advisor: { name: "Kadir Hançer", role: "Takım Sorumlusu", photo: "/images/team/kadir.jpg" },
    members: [
      { name: "Arda Akalın", role: "Takım Kaptanı", captain: true, photo: "/images/team/arda.jpg" },
      { name: "Sualp Çelik", role: "Takım Kaptanı", captain: true, photo: null },
      { name: "Emir Sakarya", role: "Hibrit Kaptan", captain: true },
    ],
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("normalizeName", () => {
  it("kırpar ve iç boşlukları teke indirir", () => {
    expect(normalizeName("  Arda   Akalın ")).toBe(normalizeName("Arda Akalın"));
  });

  it("aksan/şapka farkını yok sayar", () => {
    expect(normalizeName("İbrahim Özdemir")).toBe(normalizeName("Ibrahim Ozdemir"));
    expect(normalizeName("Sualp Çelik")).toBe(normalizeName("Sualp Celik"));
  });

  it("büyük/küçük harf farkını yok sayar", () => {
    expect(normalizeName("ARDA AKALIN")).toBe(normalizeName("arda akalın"));
  });

  it("farklı isimleri ayrı tutar", () => {
    expect(normalizeName("Arda Akalın")).not.toBe(normalizeName("Ali Arda Tırnava"));
  });
});

describe("buildPhotoMap", () => {
  it("fotoğrafı olan üyeleri mutlak URL ile haritaya koyar", () => {
    const map = buildPhotoMap(SITE);
    expect(map.get(normalizeName("Arda Akalın"))).toBe(
      "https://raw.githubusercontent.com/iWeslax83/stratos-website/main/public/images/team/arda.jpg",
    );
  });

  it("danışmanı da haritaya koyar", () => {
    expect(buildPhotoMap(SITE).get(normalizeName("Kadir Hançer"))).toContain("kadir.jpg");
  });

  it("photo null veya eksik olan üyeyi atlar", () => {
    const map = buildPhotoMap(SITE);
    expect(map.has(normalizeName("Sualp Çelik"))).toBe(false);
    expect(map.has(normalizeName("Emir Sakarya"))).toBe(false);
  });

  it("beklenmeyen şekilde boş harita döner", () => {
    expect(buildPhotoMap(null).size).toBe(0);
    expect(buildPhotoMap({ team: {} }).size).toBe(0);
    expect(buildPhotoMap({ team: { members: "bozuk" } }).size).toBe(0);
  });
});

describe("fetchTeamPhotos", () => {
  it("siteden çekip haritayı kurar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(SITE), { status: 200 })),
    );
    const map = await fetchTeamPhotos();
    expect(map.get(normalizeName("Arda Akalın"))).toContain("arda.jpg");
  });

  it("HTTP hatasında boş harita döner", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 404 })));
    expect((await fetchTeamPhotos()).size).toBe(0);
  });

  it("ağ hatasında boş harita döner", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ağ yok");
      }),
    );
    expect((await fetchTeamPhotos()).size).toBe(0);
  });

  it("geçersiz JSON'da boş harita döner", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{bozuk", { status: 200 })));
    expect((await fetchTeamPhotos()).size).toBe(0);
  });
});
