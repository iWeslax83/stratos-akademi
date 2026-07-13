// GERÇEK arama probu: canlı Supabase'e çıkar. Normal koşuda ATLANIR.
//   REAL_SCAN=1 npx vitest run src/test/search/zz-real-search.probe.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { ara } from "@/lib/search/queries";

function env(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = /^([A-Z_0-9]+)=(.*)$/.exec(line.trim());
    if (m) out[m[1]] = m[2];
  }
  return out;
}

describe.skipIf(!process.env.REAL_SCAN)("gerçek arama", () => {
  it("gerçek müfredatta ders bulur", async () => {
    const e = env();
    const svc = createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    for (const q of ["lehim", "pcb", "web"]) {
      const r = await ara(svc, q);
      console.log(`"${q}" → ${r.length} sonuç:`, r.slice(0, 3).map((x) => `${x.tur}:${x.baslik}`).join(" | "));
      expect(r.length).toBeGreaterThan(0);
    }

    // Aksansız yazılan sorgu aksanlı içeriği bulmalı ("Uçuş Kontrol & Kurulum" modülü) —
    // Postgres ilike bunu bulamazdı, normalize edilmiş eşleştirme bulur.
    const aksansiz = await ara(svc, "ucus");
    console.log('"ucus" →', aksansiz.map((x) => `${x.tur}:${x.baslik}`).join(" | "));
    expect(aksansiz.length).toBeGreaterThan(0);
  }, 60000);
});
