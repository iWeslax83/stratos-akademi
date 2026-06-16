export type Lesson = {
  id: string;
  baslik: string;
  youtube_video_id: string;
  aciklama: string | null;
  sure_sn: number | null;
  sira: number;
};

export type Module = {
  id: string;
  ad: string;
  aciklama: string | null;
  sira: number;
  quiz: { id: string; baslik: string } | null;
  lessons: Lesson[];
};

export type Track = {
  id: string;
  slug: string;
  ad: string;
  aciklama: string | null;
  ikon: string | null;
  sira: number;
  modules: Module[];
};

export type Curriculum = Track[];

export type LessonStatus = "done" | "current" | "todo";

export type FlatLesson = { lesson: Lesson; module: Module; track: Track };
