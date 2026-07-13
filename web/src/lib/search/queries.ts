import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurriculum } from "@/lib/curriculum/queries";
import { sirala, type Sonuc } from "@/lib/search/rank";

// Postgres'in ilike'ı aksana duyarlıdır ("ucus" → "Uçuş"u bulamaz). Kulüp ölçeğinde
// veri küçük olduğundan satırlar çekilip eşleştirme Türkçe-normalize edilmiş halde
// JS'te yapılır. Tablolar büyürse burası pg_trgm + unaccent indeksine taşınmalı.
const LIMIT = 300;

export async function ara(supabase: SupabaseClient, q: string): Promise<Sonuc[]> {
  const curriculum = await getCurriculum(supabase);

  const [{ data: duyurular }, { data: etkinlikler }, { data: kaynaklar }] = await Promise.all([
    supabase.from("announcements").select("id, baslik, icerik").limit(LIMIT),
    supabase.from("events").select("id, baslik, aciklama, yer").limit(LIMIT),
    supabase.from("resources").select("id, baslik, aciklama, kategori, url").limit(LIMIT),
  ]);

  const sonuclar: Sonuc[] = [];

  for (const t of curriculum) {
    sonuclar.push({ tur: "dal", baslik: t.ad, altBaslik: null, href: "/mufredat" });
    for (const m of t.modules) {
      sonuclar.push({ tur: "modul", baslik: m.ad, altBaslik: t.ad, href: "/mufredat" });
      for (const l of m.lessons) {
        sonuclar.push({
          tur: "ders",
          baslik: l.baslik,
          altBaslik: `${t.ad} · ${m.ad}`,
          href: `/mufredat/${l.id}`,
        });
      }
    }
  }

  for (const d of (duyurular ?? []) as { id: string; baslik: string; icerik: string }[]) {
    sonuclar.push({ tur: "duyuru", baslik: d.baslik, altBaslik: d.icerik.slice(0, 90), href: "/duyurular" });
  }
  for (const e of (etkinlikler ?? []) as { id: string; baslik: string; aciklama: string | null; yer: string | null }[]) {
    sonuclar.push({
      tur: "etkinlik",
      baslik: e.baslik,
      altBaslik: [e.yer, e.aciklama?.slice(0, 70)].filter(Boolean).join(" · ") || null,
      href: "/etkinlikler",
    });
  }
  for (const k of (kaynaklar ?? []) as { id: string; baslik: string; aciklama: string | null; kategori: string; url: string }[]) {
    sonuclar.push({
      tur: "kaynak",
      baslik: k.baslik,
      altBaslik: [k.kategori, k.aciklama?.slice(0, 70)].filter(Boolean).join(" · ") || null,
      href: "/kaynaklar",
    });
  }

  return sirala(sonuclar, q);
}
