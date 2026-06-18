import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { QuizMetaForm } from "@/components/admin/QuizMetaForm";
import { QuestionEditor } from "@/components/admin/QuestionEditor";
import { ActionButton } from "@/components/admin/ActionButton";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { getQuizForAdmin, type AdminQuiz } from "@/lib/admin/quiz-queries";
import { createQuiz, createQuestion, deleteQuiz } from "@/app/actions/admin-quiz";

export const dynamic = "force-dynamic";

export default async function AdminQuizPage({
  params,
}: {
  params: Promise<{ trackId: string; moduleId: string }>;
}) {
  const { trackId, moduleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("ad, email")
    .eq("id", user!.id)
    .single();
  const initial = (profile?.ad ?? profile?.email ?? "E").charAt(0).toUpperCase();

  const { data: track } = await supabase.from("tracks").select("id, ad").eq("id", trackId).single();
  const { data: modul } = await supabase.from("modules").select("id, ad").eq("id", moduleId).single();
  if (!track || !modul) notFound();

  let quiz: AdminQuiz | null = null;
  let loadError = false;
  try {
    quiz = await getQuizForAdmin(moduleId);
  } catch (e) {
    console.error("getQuizForAdmin:", e);
    loadError = true;
  }

  return (
    <AppShell initial={initial} isAdmin>
      <AdminBreadcrumb
        items={[
          { label: "Müfredat", href: "/admin/mufredat" },
          { label: track.ad, href: `/admin/mufredat/${trackId}` },
          { label: modul.ad, href: `/admin/mufredat/${trackId}/${moduleId}` },
          { label: "Quiz" },
        ]}
      />
      <h1 className="mt-1 font-display text-3xl font-bold text-navy dark:text-white">
        {modul.ad} · Quiz
      </h1>

      {loadError ? (
        <Card className="mt-5 p-6">
          <p className="text-sm font-semibold text-red-600">
            Quiz yüklenemedi (servis anahtarı eksik olabilir).
          </p>
        </Card>
      ) : !quiz ? (
        <Card className="mt-5 p-6">
          <p className="mb-4 text-sm text-muted">Bu modülün quizi yok.</p>
          <ActionButton variant="gold" onAction={createQuiz.bind(null, moduleId)}>
            Quiz oluştur
          </ActionButton>
        </Card>
      ) : (
        <>
          <Card className="mt-5 p-6">
            <QuizMetaForm quiz={{ id: quiz.id, baslik: quiz.baslik, gecme_esigi: quiz.gecme_esigi }} />
          </Card>

          <div className="mt-5 space-y-4">
            {quiz.questions.length === 0 ? (
              <p className="text-sm text-muted">Henüz soru yok.</p>
            ) : (
              quiz.questions.map((q, i) => <QuestionEditor key={q.id} question={q} index={i} />)
            )}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <ActionButton onAction={createQuestion.bind(null, quiz.id)}>+ Soru ekle</ActionButton>
            <DeleteButton
              onDelete={deleteQuiz.bind(null, quiz.id)}
              uyari="Quizi, tüm sorularını ve şıklarını silmek istediğine emin misin?"
            />
          </div>
        </>
      )}
    </AppShell>
  );
}
