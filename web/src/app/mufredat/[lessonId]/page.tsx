import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LessonSection } from "@/components/curriculum/LessonSection";
import { ModuleQuizCard } from "@/components/curriculum/ModuleQuizCard";
import { LessonQa } from "@/components/lessons/LessonQa";
import { getCurriculum, getCompletedLessonIds } from "@/lib/curriculum/queries";
import { getBestScore } from "@/lib/quiz/queries";
import { getLessonThread } from "@/lib/lessons/queries";
import { flatten, findNext } from "@/lib/curriculum/progress";
import { isAdminUser } from "@/lib/auth/is-admin";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const curriculum = await getCurriculum(supabase);
  const found = flatten(curriculum).find((f) => f.lesson.id === lessonId);
  if (!found) notFound();

  const completed = user ? await getCompletedLessonIds(supabase, user.id) : new Set<string>();
  const next = findNext(curriculum, lessonId);
  const quiz = found.module.quiz;
  const quizBest = quiz && user ? await getBestScore(supabase, user.id, quiz.id) : null;
  const { count: gorevSayisi } = await supabase
    .from("practical_tasks")
    .select("id", { count: "exact", head: true })
    .eq("module_id", found.module.id);
  const isAdmin = await isAdminUser(supabase, user?.id);
  const qaThread = await getLessonThread(supabase, lessonId);

  return (
    <AppShell initial={(user?.email ?? "E").charAt(0).toUpperCase()} isAdmin={isAdmin}>
      <div className="mb-4">
        <Eyebrow>
          {found.track.ad} · {found.module.ad}
        </Eyebrow>
        <h1 className="mt-3 font-display text-2xl font-bold text-navy dark:text-white">
          {found.lesson.baslik}
        </h1>
      </div>

      <LessonSection
        lessonId={found.lesson.id}
        videoId={found.lesson.youtube_video_id}
        initiallyCompleted={completed.has(found.lesson.id)}
        nextHref={next ? `/mufredat/${next.lesson.id}` : null}
      />

      {found.lesson.aciklama && (
        <p className="mt-6 max-w-[65ch] whitespace-pre-line text-[15px] leading-7 text-[#46526b] dark:text-[#9fb0c9]">
          {found.lesson.aciklama}
        </p>
      )}

      {quiz && <ModuleQuizCard quizId={quiz.id} baslik={quiz.baslik} best={quizBest} />}

      {gorevSayisi != null && gorevSayisi > 0 && (
        <Link
          href={`/mufredat/gorevler/${found.module.id}`}
          className="mt-4 flex items-center justify-between rounded-core border border-[var(--line)] bg-[var(--panel)] p-5"
        >
          <span className="font-display font-bold text-navy dark:text-white">
            Pratik Görevler ({gorevSayisi})
          </span>
          <span className="text-sm font-semibold text-gold">Görevlere git →</span>
        </Link>
      )}

      {user && (
        <LessonQa lessonId={found.lesson.id} viewerId={user.id} viewerIsAdmin={isAdmin} items={qaThread} />
      )}
    </AppShell>
  );
}
