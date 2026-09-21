import type { VideoDetail } from "@/lib/videos/types";

export type DersEkleme = {
  module_id: string;
  baslik: string;
  youtube_video_id: string;
  aciklama: null;
  sure_sn: number;
  sira: number;
};

// Eklenecek satırları üretir: süre videodan gelir, sıra modülün son sırası + 1'den başlar,
// açıklama boş kalır (YouTube açıklamaları üyeye gösterilmez).
export function planLessonInsert(
  moduleId: string,
  sonSira: number | null,
  videolar: { detail: VideoDetail; baslik?: string }[],
): DersEkleme[] {
  const ilk = (sonSira ?? -1) + 1;
  return videolar.map(({ detail, baslik }, i) => ({
    module_id: moduleId,
    baslik: baslik?.trim() || detail.baslik,
    youtube_video_id: detail.youtube_video_id,
    aciklama: null,
    sure_sn: detail.sure_sn,
    sira: ilk + i,
  }));
}
