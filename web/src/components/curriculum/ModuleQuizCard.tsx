import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { CheckIcon } from "@/components/ui/icons";
import { buttonClasses } from "@/components/ui/Button";

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
          <span className="text-xs font-bold text-accent-fg">
            Modül Quizi
          </span>
          <h3 className="mt-1 font-display text-lg font-bold text-fg">{baslik}</h3>
          {best && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
              En iyi: %{best.puan}
              {best.gecti && (
                <>
                  <span aria-hidden>·</span>
                  <CheckIcon size={14} className="text-green-600" />
                  <span className="text-success-fg">geçtin</span>
                </>
              )}
            </p>
          )}
        </div>
        <Link
          href={`/mufredat/quiz/${quizId}`}
          className={buttonClasses("accent", false)}
        >
          {best ? "Tekrar çöz" : "Başla"}
        </Link>
      </div>
    </Card>
  );
}
