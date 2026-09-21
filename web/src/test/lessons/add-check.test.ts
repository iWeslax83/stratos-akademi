import { describe, it, expect } from "vitest";
import { lessonAddCheck, buildContext, KOD_METNI, type LessonAddContext } from "@/lib/lessons/add-check";
import type { VideoDetail } from "@/lib/videos/types";

const NOW = new Date("2026-09-20T12:00:00Z");
const TEMIZ: LessonAddContext = { ayniModulde: false, baskaModulde: null, kuyrukta: null };

function video(over: Partial<VideoDetail> = {}): VideoDetail {
  return {
    youtube_video_id: "dQw4w9WgXcQ",
    baslik: "Ardupilot ile PID ayarı nasıl yapılır",
    aciklama: "",
    kanal: "Kanal",
    sure_sn: 900,
    izlenme: 10,
    yayin_tarihi: "2025-06-01T00:00:00Z",
    embeddable: true,
    blockedInTR: false,
    isLiveRemnant: false,
    ...over,
  };
}

describe("lessonAddCheck", () => {
  it("temiz video için engel ve uyarı yok", () => {
    expect(lessonAddCheck(video(), TEMIZ, NOW)).toEqual({ engeller: [], uyarilar: [] });
  });
  it("izlenme sayısı düşük olsa da engel ya da uyarı değildir", () => {
    expect(lessonAddCheck(video({ izlenme: 0 }), TEMIZ, NOW)).toEqual({ engeller: [], uyarilar: [] });
  });
  it("bulunamayan video (null) tek başına 'bulunamadi' engelidir", () => {
    expect(lessonAddCheck(null, TEMIZ, NOW)).toEqual({ engeller: ["bulunamadi"], uyarilar: [] });
  });
  it("canlı yayın, gömülemez ve TR engeli engeldir", () => {
    const r = lessonAddCheck(video({ isLiveRemnant: true, embeddable: false, blockedInTR: true }), TEMIZ, NOW);
    expect(r.engeller).toEqual(["canli_yayin", "gomulemez", "tr_engelli"]);
  });
  it("süre okunamadıysa (0) engeldir", () => {
    expect(lessonAddCheck(video({ sure_sn: 0 }), TEMIZ, NOW).engeller).toEqual(["sure_okunamadi"]);
  });
  it("aynı modülde varsa engel; başka modülde varsa yalnız uyarı", () => {
    expect(lessonAddCheck(video(), { ...TEMIZ, ayniModulde: true }, NOW).engeller).toEqual(["ayni_modulde"]);
    const r = lessonAddCheck(video(), { ...TEMIZ, baskaModulde: "Aviyonik > Sensörler" }, NOW);
    expect(r.engeller).toEqual([]);
    expect(r.uyarilar).toEqual(["baska_modulde"]);
  });
  it("kuyruk durumuna göre uyarı verir", () => {
    expect(lessonAddCheck(video(), { ...TEMIZ, kuyrukta: "pending" }, NOW).uyarilar).toEqual(["kuyrukta_bekliyor"]);
    expect(lessonAddCheck(video(), { ...TEMIZ, kuyrukta: "rejected" }, NOW).uyarilar).toEqual(["cop_kutusunda"]);
    expect(lessonAddCheck(video(), { ...TEMIZ, kuyrukta: "blacklist" }, NOW).uyarilar).toEqual(["kara_listede"]);
  });
  it("kısa, eski ve yabancı dilli videolar uyarıdır, engel değil", () => {
    const kisa = lessonAddCheck(video({ sure_sn: 120 }), TEMIZ, NOW);
    expect(kisa).toEqual({ engeller: [], uyarilar: ["kisa"] });
    const eski = lessonAddCheck(video({ yayin_tarihi: "2020-01-01T00:00:00Z" }), TEMIZ, NOW);
    expect(eski).toEqual({ engeller: [], uyarilar: ["eski"] });
    const dil = lessonAddCheck(video({ baslik: "Как настроить полётный контроллер" }), TEMIZ, NOW);
    expect(dil).toEqual({ engeller: [], uyarilar: ["dil"] });
  });
  it("her kodun bir Türkçe metni vardır", () => {
    const kodlar = [
      "bulunamadi", "canli_yayin", "gomulemez", "tr_engelli", "sure_okunamadi", "ayni_modulde",
      "baska_modulde", "kuyrukta_bekliyor", "cop_kutusunda", "kara_listede", "kisa", "eski", "dil",
    ] as const;
    for (const k of kodlar) expect(KOD_METNI[k].length).toBeGreaterThan(3);
  });
});

describe("buildContext", () => {
  const dersler = [
    { module_id: "m1", youtube_video_id: "aaaaaaaaaaa", modul_ad: "Sensörler", dal_ad: "Aviyonik" },
    { module_id: "m2", youtube_video_id: "bbbbbbbbbbb", modul_ad: "Web", dal_ad: "Yazılım" },
  ];
  it("aynı modülde ve başka modülde ayrımı yapar", () => {
    const m = buildContext(["aaaaaaaaaaa", "bbbbbbbbbbb", "ccccccccccc"], {
      moduleId: "m1", dersler, oneriler: [], kara: [],
    });
    expect(m.get("aaaaaaaaaaa")).toEqual({ ayniModulde: true, baskaModulde: null, kuyrukta: null });
    expect(m.get("bbbbbbbbbbb")).toEqual({ ayniModulde: false, baskaModulde: "Yazılım > Web", kuyrukta: null });
    expect(m.get("ccccccccccc")).toEqual(TEMIZ);
  });
  it("öneri ve kara liste durumunu işler, approved öneriyi yok sayar", () => {
    const m = buildContext(["p", "r", "k", "a"], {
      moduleId: "m1",
      dersler: [],
      oneriler: [
        { youtube_video_id: "p", durum: "pending" },
        { youtube_video_id: "r", durum: "rejected" },
        { youtube_video_id: "a", durum: "approved" },
      ],
      kara: ["k"],
    });
    expect(m.get("p")?.kuyrukta).toBe("pending");
    expect(m.get("r")?.kuyrukta).toBe("rejected");
    expect(m.get("k")?.kuyrukta).toBe("blacklist");
    expect(m.get("a")?.kuyrukta).toBeNull();
  });
});
