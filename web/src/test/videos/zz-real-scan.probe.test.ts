// GERÇEK tarama probu — YouTube/Gemini/Supabase'e canlı çıkar. Normal test koşusunda ATLANIR.
// Çalıştırmak için:  REAL_SCAN=1 npx vitest run src/test/videos/zz-real-scan.probe.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { createProductionPorts } from "@/lib/videos/ports";
import { runVideoScan } from "@/lib/videos/scan";
import { huniMetni, neOldu } from "@/lib/videos/diag-text";

function env(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = /^([A-Z_0-9]+)=(.*)$/.exec(line.trim());
    if (m) out[m[1]] = m[2];
  }
  return out;
}

describe.skipIf(!process.env.REAL_SCAN)("GERÇEK tarama probu", () => {
  it("uçtan uca koşar ve huniyi raporlar", async () => {
    const e = env();
    const svc = createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const ports = createProductionPorts(svc, {
      youtubeKey: e.YOUTUBE_API_KEY,
      geminiKey: e.GOOGLE_API_KEY,
    });

    const { tracks, modules } = await ports.getCurriculum();
    console.log("MÜFREDAT:", tracks.length, "track,", modules.length, "modül");
    console.log("MODÜLLER:", modules.map((m) => m.ad).join(" | "));

    const summary = await runVideoScan(ports);
    console.log("HUNİ:", huniMetni(summary.diag));
    console.log("SONUÇ:", JSON.stringify({ ...summary, diag: undefined }));
    console.log("NE OLDU:", neOldu(summary.diag) ?? "başarılı — öneri üretildi");
    console.log("HATALAR:", summary.diag.hatalar);

    expect(summary.diag.modul_sayisi).toBeGreaterThan(0);
  }, 180000);
});
