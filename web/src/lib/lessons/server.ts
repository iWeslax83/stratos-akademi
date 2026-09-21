import type { SupabaseClient } from "@supabase/supabase-js";
import type { VideoDetail } from "@/lib/videos/types";
import { fetchVideoDetails } from "@/lib/videos/youtube-api";
import {
  buildContext, lessonAddCheck, KOD_METNI,
  type DersSatiri, type OneriSatiri, type LessonAddContext, type LessonAddResult,
} from "@/lib/lessons/add-check";
import { planLessonInsert } from "@/lib/lessons/insert-plan";

// Manuel ekleme çekirdeği (sunucu). İki giriş yolu aynı kuralları paylaşır:
// video ekleme aksiyonları ve öneri kabulü. "use server" DEĞİL: yalnız aksiyonlardan çağrılır.

export const MAX_VIDEO = 100;
const ID_RE = /^[A-Za-z0-9_-]{11}$/;

export const YOUTUBE_ULASILAMADI = "YouTube'a ulaşılamadı, biraz sonra tekrar dene.";

type Rel<T> = T | T[] | null;
function one<T>(r: Rel<T>): T | null {
  return Array.isArray(r) ? (r[0] ?? null) : r;
}

// Dersler, öneriler ve kara liste: video sayısından bağımsız 3 sorgu.
export async function loadContexts(
  db: SupabaseClient,
  moduleId: string,
  ids: string[],
): Promise<Map<string, LessonAddContext>> {
  if (ids.length === 0) return new Map();
  const [l, s, b] = await Promise.all([
    db.from("lessons").select("module_id, youtube_video_id, modules(ad, tracks(ad))").in("youtube_video_id", ids),
    db.from("video_suggestions").select("youtube_video_id, durum").in("youtube_video_id", ids),
    db.from("video_blacklist").select("youtube_video_id").in("youtube_video_id", ids),
  ]);
  const err = l.error ?? s.error ?? b.error;
  if (err) throw new Error(`bağlam okunamadı: ${err.message}`);

  type LessonRow = {
    module_id: string;
    youtube_video_id: string;
    modules: Rel<{ ad: string; tracks: Rel<{ ad: string }> }>;
  };
  const dersler: DersSatiri[] = ((l.data ?? []) as unknown as LessonRow[]).map((r) => {
    const m = one(r.modules);
    return {
      module_id: r.module_id,
      youtube_video_id: r.youtube_video_id,
      modul_ad: m?.ad ?? "?",
      dal_ad: one(m?.tracks ?? null)?.ad ?? "?",
    };
  });
  return buildContext(ids, {
    moduleId,
    dersler,
    oneriler: (s.data ?? []) as OneriSatiri[],
    kara: ((b.data ?? []) as { youtube_video_id: string }[]).map((r) => r.youtube_video_id),
  });
}

// YouTube'dan ayrıntı çeker. Herhangi bir çağrı hata verdiyse hata döner: eksik gelen
// videoyu "bulunamadı" sanmak yerine işlemi durdurur.
export async function getDetails(
  ids: string[],
  apiKey: string,
): Promise<{ details: Map<string, VideoDetail>; hata: string | null }> {
  let hata: string | null = null;
  const list = await fetchVideoDetails(ids, { apiKey, onError: (m) => { hata = m; } });
  return { details: new Map(list.map((d) => [d.youtube_video_id, d])), hata };
}

export type DegerlendirilmisVideo = {
  id: string;
  detail: VideoDetail | null;
  ctx: LessonAddContext;
} & LessonAddResult;

export function degerlendir(
  ids: string[],
  details: Map<string, VideoDetail>,
  ctxs: Map<string, LessonAddContext>,
  now: Date = new Date(),
): DegerlendirilmisVideo[] {
  return ids.map((id) => {
    const detail = details.get(id) ?? null;
    const ctx = ctxs.get(id) ?? { ayniModulde: false, baskaModulde: null, kuyrukta: null };
    return { id, detail, ctx, ...lessonAddCheck(detail, ctx, now) };
  });
}

export function tekilGecerliIdler(ids: string[]): string[] {
  const seen = new Set<string>();
  for (const id of ids) if (ID_RE.test(id)) seen.add(id);
  return [...seen].slice(0, MAX_VIDEO);
}

export type EklemeSonucu = {
  ok: boolean;
  error?: string;
  eklenenler?: { id: string; baslik: string; sure_sn: number; sira: number }[];
  atlanan?: { id: string; neden: string }[];
};

// Videoları YouTube'dan yeniden çeker, yeniden doğrular ve geçenleri tek insert ile ekler.
// İstemci yalnız id ve (isteğe bağlı) başlık gönderir; süre ve sıra burada hesaplanır.
export async function addVideosToModule(
  db: SupabaseClient,
  args: {
    moduleId: string;
    videoIds: string[];
    basliklar?: Record<string, string>;
    userId: string | null;
    apiKey: string;
    now?: Date;
  },
): Promise<EklemeSonucu> {
  const ids = tekilGecerliIdler(args.videoIds);
  if (ids.length === 0) return { ok: false, error: "Eklenecek video yok." };

  const { details, hata } = await getDetails(ids, args.apiKey);
  if (hata) return { ok: false, error: YOUTUBE_ULASILAMADI };

  const ctxs = await loadContexts(db, args.moduleId, ids);
  const sonuc = degerlendir(ids, details, ctxs, args.now);

  const atlanan = sonuc
    .filter((r) => r.engeller.length > 0)
    .map((r) => ({ id: r.id, neden: KOD_METNI[r.engeller[0]] }));
  const gecen = sonuc.filter((r) => r.engeller.length === 0 && r.detail);
  if (gecen.length === 0) {
    return { ok: false, error: "Hiçbir ders eklenemedi.", atlanan };
  }

  const { data: son, error: sonErr } = await db
    .from("lessons").select("sira").eq("module_id", args.moduleId)
    .order("sira", { ascending: false }).limit(1).maybeSingle();
  if (sonErr) throw new Error(`sıra okunamadı: ${sonErr.message}`);

  const rows = planLessonInsert(
    args.moduleId,
    (son?.sira as number | undefined) ?? null,
    gecen.map((r) => ({ detail: r.detail as VideoDetail, baslik: args.basliklar?.[r.id] })),
  );
  const { error: insErr } = await db.from("lessons").insert(rows);
  if (insErr) {
    if (insErr.code === "23505") return { ok: false, error: "Bu video modülde zaten var.", atlanan };
    throw new Error(insErr.message);
  }

  // Kuyrukta bekleyen öneriler artık ders: onaylı say (hata eklemeyi geri almaz).
  const { error: onayErr } = await db
    .from("video_suggestions")
    .update({ durum: "approved", karar_veren: args.userId, karar_at: new Date().toISOString() })
    .in("youtube_video_id", rows.map((r) => r.youtube_video_id))
    .eq("durum", "pending");
  if (onayErr) console.error("addVideosToModule: öneri onayı:", onayErr.message);

  return {
    ok: true,
    eklenenler: rows.map((r) => ({ id: r.youtube_video_id, baslik: r.baslik, sure_sn: r.sure_sn, sira: r.sira })),
    atlanan,
  };
}

// Tek bir dersin videosu için süreyi YouTube'dan alır ve engelleri uygular.
// kendiKaydi=true: video zaten bu dersin kendisi, "aynı modülde var" engeli sayılmaz.
export async function hazirlaSure(
  db: SupabaseClient,
  args: { moduleId: string; videoId: string; apiKey: string; kendiKaydi: boolean },
): Promise<{ ok: true; sure_sn: number } | { ok: false; error: string }> {
  const { details, hata } = await getDetails([args.videoId], args.apiKey);
  if (hata) return { ok: false, error: YOUTUBE_ULASILAMADI };
  const ctxs = await loadContexts(db, args.moduleId, [args.videoId]);
  const [r] = degerlendir([args.videoId], details, ctxs);
  const engeller = args.kendiKaydi ? r.engeller.filter((k) => k !== "ayni_modulde") : r.engeller;
  if (engeller.length > 0 || !r.detail) return { ok: false, error: KOD_METNI[engeller[0] ?? "bulunamadi"] };
  return { ok: true, sure_sn: r.detail.sure_sn };
}
