export type Lang = "tr" | "en" | "other";

export type TrackRow = { id: string; ad: string };
export type ModuleRow = { id: string; track_id: string; ad: string };

// videos.list yanıtından normalize edilmiş aday
export type VideoDetail = {
  youtube_video_id: string;
  baslik: string;
  aciklama: string;
  kanal: string;
  sure_sn: number;
  izlenme: number;
  yayin_tarihi: string; // ISO 8601
  embeddable: boolean;
  blockedInTR: boolean;
  isLiveRemnant: boolean; // liveStreamingDetails vardı ya da liveBroadcastContent !== 'none'
};

export type FilterOpts = {
  now: Date;
  minViews: number;
  minDurationSn: number;
  maxAgeYears: number;
  existingIds: Set<string>; // lessons + suggestions + blacklist
};

export type Classification = {
  uygun: boolean;
  module_id: string | null;
  skor: number;
  gerekce: string;
};

export type PendingRow = {
  youtube_video_id: string;
  baslik: string;
  aciklama: string | null;
  kanal: string | null;
  sure_sn: number | null;
  izlenme: number | null;
  yayin_tarihi: string | null;
  onerilen_module_id: string;
  uygunluk_skoru: number;
  gerekce: string;
  durum: "pending";
};

// Bir videonun mekanik filtrede neden elendiği. Teşhis hunisinin ana ekseni.
export type RedNedeni =
  | "zaten_var"
  | "canli_yayin"
  | "gomulemez"
  | "tr_engelli"
  | "az_izlenme"
  | "kisa_sure"
  | "eski"
  | "dil";

export type ScanDiag = {
  modul_sayisi: number;
  sorgu_sayisi: number;
  arama_sonucu: number; // tekrarlar dahil toplam id
  tekil_id: number;
  detay_cekilen: number;
  eleme: Record<RedNedeni, number>;
  filtreden_gecen: number; // maxCandidates kesiminden ÖNCE
  siniflandirilan: number; // Gemini'ye gönderilen
  gemini_uygun: number;
  gemini_uygunsuz: number;
  gemini_hata: number;
  hatalar: string[]; // YouTube/Gemini HTTP + ağ hataları (kota vb.)
};

export type ScanSummary = {
  taranan: number;
  aday: number;
  eklenen: number;
  budanan: number;
  diag: ScanDiag;
};

export type Esikler = { minViews: number; minDurationSn: number; maxAgeYears: number };

export type ScanPorts = {
  now: Date;
  maxCandidates: number;
  esikler?: Esikler;
  recordRun?: (summary: ScanSummary, hata: string | null) => Promise<void>;
  getErrors?: () => string[]; // YouTube/Gemini çağrılarında biriken hatalar
  getCurriculum: () => Promise<{ tracks: TrackRow[]; modules: ModuleRow[] }>;
  getExistingIds: () => Promise<Set<string>>;
  searchVideoIds: (query: string) => Promise<string[]>;
  fetchVideoDetails: (ids: string[]) => Promise<VideoDetail[]>;
  classify: (v: VideoDetail, modules: ModuleRow[]) => Promise<Classification | null>;
  insertPending: (rows: PendingRow[]) => Promise<void>;
  prune: () => Promise<number>;
  notifyAdmins: (newCount: number) => Promise<void>;
};
