// GERÇEK API probu: YouTube Data API + Gemini'ye canlı çıkar, Supabase'e DOKUNMAZ.
// Boru hattının DB dışındaki yarısını (arama → filtre → sınıflandırma → aday satırları) kanıtlar.
// Çalıştır:  REAL_SCAN=1 npx vitest run src/test/videos/zz-api-probe.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { runVideoScan } from "@/lib/videos/scan";
import { searchVideoIds, fetchVideoDetails } from "@/lib/videos/youtube-api";
import { geminiClassify } from "@/lib/videos/classify";
import { huniMetni, neOldu } from "@/lib/videos/diag-text";
import type { ScanPorts, PendingRow } from "@/lib/videos/types";

function env(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = /^([A-Z_0-9]+)=(.*)$/.exec(line.trim());
    if (m) out[m[1]] = m[2];
  }
  return out;
}

describe.skipIf(!process.env.REAL_SCAN)("GERÇEK API probu (DB'siz)", () => {
  it("gerçek YouTube + Gemini ile aday üretir", async () => {
    const e = env();
    const now = new Date();
    const publishedAfter = new Date(now.getTime() - 4 * 365.25 * 24 * 3600 * 1000).toISOString();
    const hatalar: string[] = [];
    const onError = (m: string) => hatalar.push(m);

    // Gerçek müfredat okunamıyor (service_role grant'i yok → 0031 bekliyor), o yüzden
    // projenin gerçek konusuna denk temsili bir müfredat kullanılır.
    const tracks = [{ id: "t1", ad: "İHA" }, { id: "t2", ad: "Yazılım" }];
    const modules = [
      { id: "m1", track_id: "t1", ad: "Quadcopter PID ayarı" },
      { id: "m2", track_id: "t2", ad: "Python temelleri" },
    ];

    const yazilan: PendingRow[] = [];
    const ports: ScanPorts = {
      now,
      maxCandidates: 6,
      getErrors: () => hatalar,
      getCurriculum: async () => ({ tracks, modules }),
      getExistingIds: async () => new Set<string>(),
      searchVideoIds: (q) => searchVideoIds(q, { apiKey: e.YOUTUBE_API_KEY, publishedAfter, onError }),
      fetchVideoDetails: (ids) => fetchVideoDetails(ids, { apiKey: e.YOUTUBE_API_KEY, onError }),
      classify: (v, m) => geminiClassify(v, m, { apiKey: e.GOOGLE_API_KEY, onError }),
      insertPending: async (rows) => { yazilan.push(...rows); },
      prune: async () => 0,
      notifyAdmins: async () => {},
    };

    const s = await runVideoScan(ports);
    console.log("HUNİ:", huniMetni(s.diag));
    console.log("NE OLDU:", neOldu(s.diag) ?? "başarılı — aday üretildi");
    console.log("HATALAR:", s.diag.hatalar);
    for (const r of yazilan) {
      console.log(`ADAY: [${r.uygunluk_skoru}] ${r.baslik} — ${r.kanal} — modül ${r.onerilen_module_id} — ${r.gerekce}`);
    }

    expect(s.diag.hatalar).toEqual([]);
    expect(s.diag.detay_cekilen).toBeGreaterThan(0);
    expect(yazilan.length).toBeGreaterThan(0);
  }, 300000);
});
