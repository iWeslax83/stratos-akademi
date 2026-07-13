import Link from "next/link";
import { Card } from "@/components/ui/Card";

export function ModuleQuizCard({
  quizId,
  baslik,
  best,
}: {
  quizId: string;
  baslik: string;
  best: { puan: number; gecti: boolean } | null;
}) {
  return (
    <Card className="mt-6 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-ink dark:text-accent">
            📝 Modül Quizi
          </span>
          <h3 className="mt-1 font-display text-lg font-bold text-navy dark:text-white">{baslik}</h3>
          {best && (
            <p className="mt-0.5 text-sm text-muted">
              En iyi: %{best.puan}
              {best.gecti ? " · ✓ geçtin" : ""}
            </p>
          )}
        </div>
        <Link
          href={`/mufredat/quiz/${quizId}`}
          className="rounded-full bg-accent px-5 py-2.5 font-display text-sm font-semibold text-navy"
        >
          {best ? "Tekrar çöz" : "Başla"}
        </Link>
      </div>
    </Card>
  );
}
