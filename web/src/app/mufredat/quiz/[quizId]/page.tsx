import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { AttemptHistory } from "@/components/quiz/AttemptHistory";
import { Reveal } from "@/components/ui/Reveal";
import { getQuiz, getBestScore, getAttemptHistory } from "@/lib/quiz/queries";
import { isAdminUser } from "@/lib/auth/is-admin";

export const dynamic = "force-dynamic";

export default async function QuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const quiz = await getQuiz(supabase, quizId);
  if (!quiz) notFound();

  const best = user ? await getBestScore(supabase, user.id, quizId) : null;
  const attempts = user ? await getAttemptHistory(supabase, user.id, quizId) : [];
  const isAdmin = await isAdminUser(supabase, user?.id);

  return (
    <AppShell initial={(user?.email ?? "E").charAt(0).toUpperCase()} isAdmin={isAdmin}>
      <Reveal className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Modül Quizi</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-navy dark:text-white">
          {quiz.baslik}
        </h1>
      </Reveal>
      <QuizRunner quiz={quiz} best={best} />
      <AttemptHistory attempts={attempts} />
    </AppShell>
  );
}
