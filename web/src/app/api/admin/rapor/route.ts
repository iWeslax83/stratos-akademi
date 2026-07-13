import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { analitikVerisi } from "@/lib/admin/rapor";
import { toCsv, dosyaAdi, type Kolon } from "@/lib/admin/csv";
import type { UyeSatiri, DersSatiri, QuizSatiri } from "@/lib/admin/rapor";

export const dynamic = "force-dynamic";

export type RaporTipi = "uyeler" | "dersler" | "quizler";

export function gecerliTip(v: string | null): RaporTipi | null {
  return v === "uyeler" || v === "dersler" || v === "quizler" ? v : null;
}

const UYE_KOLON: Kolon<UyeSatiri>[] = [
  { baslik: "Üye", deger: (u) => u.ad },
  { baslik: "Tamamlanan ders", deger: (u) => u.ders },
  { baslik: "Puan", deger: (u) => u.puan },
  { baslik: "Son aktivite (gün önce)", deger: (u) => u.gun },
  { baslik: "Aktif (7 gün)", deger: (u) => (u.aktif ? "evet" : "hayır") },
];

const DERS_KOLON: Kolon<DersSatiri>[] = [
  { baslik: "Ders", deger: (d) => d.baslik },
  { baslik: "Yer", deger: (d) => d.yer },
  { baslik: "Tamamlayan üye", deger: (d) => d.tamam },
];

const QUIZ_KOLON: Kolon<QuizSatiri>[] = [
  { baslik: "Quiz", deger: (q) => q.baslik },
  { baslik: "Yer", deger: (q) => q.yer },
  { baslik: "Ortalama puan", deger: (q) => q.ortBest },
  { baslik: "Geçen", deger: (q) => q.gecen },
  { baslik: "Deneyen", deger: (q) => q.deneyen },
];

export async function GET(request: Request): Promise<Response> {
  const tip = gecerliTip(new URL(request.url).searchParams.get("tip"));
  if (!tip) return Response.json({ error: "geçersiz rapor tipi" }, { status: 400 });

  // Rapor herkesin verisini içerir → service_role'e geçmeden ÖNCE admin doğrula.
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return Response.json({ error: "yetkisiz" }, { status: 403 });

  const veri = await analitikVerisi(supabase, createServiceClient(), Date.now());
  const csv =
    tip === "uyeler" ? toCsv(veri.uyeler, UYE_KOLON)
    : tip === "dersler" ? toCsv(veri.dersler, DERS_KOLON)
    : toCsv(veri.quizler, QUIZ_KOLON);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${dosyaAdi(tip, new Date())}"`,
      "Cache-Control": "no-store",
    },
  });
}
