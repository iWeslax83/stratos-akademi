import type { VideoDetail } from "@/lib/videos/types";
import { detectLang } from "@/lib/videos/lang";

export type EngelKodu =
  | "bulunamadi" | "canli_yayin" | "gomulemez" | "tr_engelli" | "sure_okunamadi" | "ayni_modulde";
export type UyariKodu =
  | "baska_modulde" | "kuyrukta_bekliyor" | "cop_kutusunda" | "kara_listede" | "kisa" | "eski" | "dil";
export type Kod = EngelKodu | UyariKodu;

export const KOD_METNI: Record<Kod, string> = {
  bulunamadi: "Video bulunamadı (silinmiş ya da özel).",
  canli_yayin: "Canlı yayın kaydı, ders olarak eklenemez.",
  gomulemez: "Sahibi sitede gömülü oynatmaya izin vermiyor.",
  tr_engelli: "Türkiye'de izlenemiyor.",
  sure_okunamadi: "Süre okunamadı, ilerleme doğrulanamaz.",
  ayni_modulde: "Bu video modülde zaten var.",
  baska_modulde: "Başka bir modülde de var.",
  kuyrukta_bekliyor: "Öneri kuyruğunda bekliyor. Eklenirse öneri onaylanmış sayılır.",
  cop_kutusunda: "Daha önce reddedilmiş, çöp kutusunda.",
  kara_listede: "Kara listede, daha önce kalıcı silinmiş.",
  kisa: "3 dakikadan kısa.",
  eski: "4 yıldan eski.",
  dil: "Türkçe ya da İngilizce görünmüyor.",
};

export type LessonAddContext = {
  ayniModulde: boolean;
  baskaModulde: string | null; // "Dal > Modül"
  kuyrukta: "pending" | "rejected" | "blacklist" | null;
};

export type LessonAddResult = { engeller: EngelKodu[]; uyarilar: UyariKodu[] };

const KISA_SN = 180;
const ESKI_YIL = 4;

function ageYears(iso: string, now: Date): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return Infinity;
  return (now.getTime() - t) / (365.25 * 24 * 3600 * 1000);
}

// Manuel ekleme doğrulaması. Öneri taramasındaki redNedeni'nden bilerek ayrı: izlenme eşiği
// yok (yönetici videoyu kendisi seçiyor) ve aynı modül dışındaki durumlar engel değil uyarı.
export function lessonAddCheck(
  v: VideoDetail | null,
  ctx: LessonAddContext,
  now: Date = new Date(),
): LessonAddResult {
  if (!v) return { engeller: ["bulunamadi"], uyarilar: [] };

  const engeller: EngelKodu[] = [];
  if (v.isLiveRemnant) engeller.push("canli_yayin");
  if (!v.embeddable) engeller.push("gomulemez");
  if (v.blockedInTR) engeller.push("tr_engelli");
  if ((v.sure_sn ?? 0) <= 0) engeller.push("sure_okunamadi");
  if (ctx.ayniModulde) engeller.push("ayni_modulde");

  const uyarilar: UyariKodu[] = [];
  if (ctx.baskaModulde) uyarilar.push("baska_modulde");
  if (ctx.kuyrukta === "pending") uyarilar.push("kuyrukta_bekliyor");
  if (ctx.kuyrukta === "rejected") uyarilar.push("cop_kutusunda");
  if (ctx.kuyrukta === "blacklist") uyarilar.push("kara_listede");
  if (v.sure_sn > 0 && v.sure_sn < KISA_SN) uyarilar.push("kisa");
  if (ageYears(v.yayin_tarihi, now) > ESKI_YIL) uyarilar.push("eski");
  if (detectLang(`${v.baslik} ${v.aciklama}`) === "other") uyarilar.push("dil");

  return { engeller, uyarilar };
}

export type DersSatiri = { module_id: string; youtube_video_id: string; modul_ad: string; dal_ad: string };
export type OneriSatiri = { youtube_video_id: string; durum: "pending" | "approved" | "rejected" };

// Tek toplu sorgu sonucundan (dersler, öneriler, kara liste) her video için bağlamı üretir.
export function buildContext(
  videoIds: string[],
  data: { moduleId: string; dersler: DersSatiri[]; oneriler: OneriSatiri[]; kara: string[] },
): Map<string, LessonAddContext> {
  const kara = new Set(data.kara);
  const out = new Map<string, LessonAddContext>();
  for (const id of videoIds) {
    const yerler = data.dersler.filter((d) => d.youtube_video_id === id);
    const baska = yerler.find((d) => d.module_id !== data.moduleId);
    const oneri = data.oneriler.find((o) => o.youtube_video_id === id && o.durum !== "approved");
    out.set(id, {
      ayniModulde: yerler.some((d) => d.module_id === data.moduleId),
      baskaModulde: baska ? `${baska.dal_ad} > ${baska.modul_ad}` : null,
      kuyrukta: oneri ? oneri.durum as "pending" | "rejected" : kara.has(id) ? "blacklist" : null,
    });
  }
  return out;
}
