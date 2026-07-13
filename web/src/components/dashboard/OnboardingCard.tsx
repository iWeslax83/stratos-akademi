import Link from "next/link";

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
      <h2 className="font-display text-xl font-bold text-navy dark:text-white">Buradan başla</h2>
      <p className="mt-1.5 max-w-[60ch] text-[15px] leading-6 text-[#46526b] dark:text-[#9fb0c9]">
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
              <div className="font-semibold text-navy dark:text-white">{s.baslik}</div>
              <div className="text-sm text-muted">{s.metin}</div>
            </div>
          </li>
        ))}
      </ol>

      {firstLessonId && (
        <Link
          href={`/mufredat/${firstLessonId}`}
          className="mt-6 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-navy hover:bg-accent-dark hover:text-white"
        >
          {firstLessonTitle ? `İlk dersine başla: ${firstLessonTitle}` : "İlk dersine başla"} →
        </Link>
      )}
    </div>
  );
}
