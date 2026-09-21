"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, actorId } from "@/lib/auth/actor";
import { parseYouTubeInput } from "@/lib/admin/youtube";
import { fetchPlaylistVideoIds } from "@/lib/videos/youtube-api";
import type { EngelKodu, UyariKodu } from "@/lib/lessons/add-check";
import {
  MAX_VIDEO, YOUTUBE_ULASILAMADI, getDetails, loadContexts, degerlendir, addVideosToModule,
  tekilGecerliIdler, type EklemeSonucu,
} from "@/lib/lessons/server";

export type OnizleSatir = {
  id: string;
  baslik: string;
  kanal: string;
  sure_sn: number;
  engeller: EngelKodu[];
  uyarilar: UyariKodu[];
  baskaModulde: string | null;
};

export type OnizleSonuc =
  | { ok: true; tur: "video" | "playlist"; satirlar: OnizleSatir[]; truncated: boolean; playlistId?: string }
  | { ok: false; error: string };

// Yapıştırılan video ya da playlist linkini çözer, YouTube'dan bilgiyi çeker ve her video
// için engel/uyarı listesini döner. Veritabanına yazmaz.
export async function onizle(giris: string, moduleId: string): Promise<OnizleSonuc> {
  try {
    const supabase = await createClient();
    const gate = await requireAdmin(supabase);
    if (!gate.ok) return { ok: false, error: gate.error };
    if (!moduleId) return { ok: false, error: "Modül eksik." };

    const parsed = parseYouTubeInput(giris);
    if (!parsed) return { ok: false, error: "Geçerli bir YouTube video ya da playlist linki yapıştır." };

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return { ok: false, error: "YOUTUBE_API_KEY tanımlı değil." };

    let ids: string[];
    let truncated = false;
    if (parsed.tur === "playlist") {
      const r = await fetchPlaylistVideoIds(parsed.id, { apiKey, max: MAX_VIDEO });
      if (r.ids.length === 0) {
        return { ok: false, error: "Playlist okunamadı (bulunamadı, özel ya da YouTube'a ulaşılamadı)." };
      }
      ids = tekilGecerliIdler(r.ids);
      truncated = r.truncated;
    } else {
      ids = [parsed.id];
    }

    const { details, hata } = await getDetails(ids, apiKey);
    if (hata) return { ok: false, error: YOUTUBE_ULASILAMADI };
    const ctxs = await loadContexts(supabase, moduleId, ids);

    const satirlar: OnizleSatir[] = degerlendir(ids, details, ctxs).map((r) => ({
      id: r.id,
      baslik: r.detail?.baslik ?? r.id,
      kanal: r.detail?.kanal ?? "",
      sure_sn: r.detail?.sure_sn ?? 0,
      engeller: r.engeller,
      uyarilar: r.uyarilar,
      baskaModulde: r.ctx.baskaModulde,
    }));

    return {
      ok: true,
      tur: parsed.tur,
      satirlar,
      truncated,
      ...(parsed.tur === "video" && parsed.playlistId ? { playlistId: parsed.playlistId } : {}),
    };
  } catch (e) {
    console.error("onizle:", e);
    return { ok: false, error: "Beklenmeyen hata." };
  }
}

// Seçilen videoları modüle ekler. Önizlemedeki durum yeniden doğrulanır (istemciye güvenilmez).
export async function addLessonsFromVideos(
  moduleId: string,
  videoIds: string[],
  basliklar: Record<string, string> = {},
): Promise<EklemeSonucu> {
  try {
    const supabase = await createClient();
    const gate = await requireAdmin(supabase);
    if (!gate.ok) return { ok: false, error: gate.error };
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return { ok: false, error: "YOUTUBE_API_KEY tanımlı değil." };

    const { data: modul } = await supabase.from("modules").select("id, track_id").eq("id", moduleId).maybeSingle();
    if (!modul) return { ok: false, error: "Modül bulunamadı." };

    const userId = await actorId(supabase);
    const r = await addVideosToModule(supabase, { moduleId, videoIds, basliklar, userId, apiKey });
    if (r.ok) {
      revalidatePath(`/admin/mufredat/${modul.track_id}/${moduleId}`);
      revalidatePath("/admin/oneriler");
      revalidatePath("/mufredat");
    }
    return r;
  } catch (e) {
    console.error("addLessonsFromVideos:", e);
    return { ok: false, error: "Beklenmeyen hata." };
  }
}
