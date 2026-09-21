import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

// Yeni üye için "buradan başla" rehberi. Gerçek akışı anlatır: izle → çöz → gönder.
export function OnboardingCard({
  firstLessonId,
  firstLessonTitle,
}: {
  firstLessonId: string | null;
  firstLessonTitle: string | null;
}) {
  const steps = [
    {
      n: 1,
      baslik: "İlk dersini izle",
      metin: "Videoyu sonuna kadar izleyince ders otomatik tamamlanır.",
    },
    {
      n: 2,
      baslik: "Modül quizini çöz",
      metin: "Her modülün sonunda kısa bir quiz var; geçince yetkinlik kazanırsın.",
    },
    {
      n: 3,
      baslik: "Pratik görev gönder",
      metin: "Kaptan onayladıkça puan toplar, liderlik tablosunda yükselirsin.",
    },
  ];

  return (
    <div className="p-6">
      <h2 className="font-display text-xl font-bold text-fg">Buradan başla</h2>
      <p className="mt-1.5 max-w-[60ch] text-base leading-6 text-fg-soft">
        Stratos Akademi&apos;de akış basit: video izle, quiz çöz, pratik görevi gönder.
        İlerlemen burada, profilinde ve liderlik tablosunda görünür.
      </p>

      <ol className="mt-5 space-y-3">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy text-sm font-bold text-white dark:bg-accent dark:text-navy">
              {s.n}
            </span>
            <div>
              <div className="font-semibold text-fg">{s.baslik}</div>
              <div className="text-sm text-muted">{s.metin}</div>
            </div>
          </li>
        ))}
      </ol>

      {firstLessonId && (
        <Link
          href={`/mufredat/${firstLessonId}`}
          className={buttonClasses("accent", false, "mt-6")}
        >
          {firstLessonTitle ? `İlk dersine başla: ${firstLessonTitle}` : "İlk dersine başla"} →
        </Link>
      )}
    </div>
  );
}
