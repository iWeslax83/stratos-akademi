"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { LogoMark } from "@/components/brand/LogoMark";
import { ArrowRightIcon } from "@/components/ui/icons";

const HATA: Record<string, string> = {
  not_allowed: "Bu e-posta izin listesinde değil. Kulüp kaptanından davet iste.",
  missing_code: "Giriş tamamlanamadı. Tekrar dene.",
};

function LoginCard() {
  const params = useSearchParams();
  const hata = HATA[params.get("error") ?? ""] ?? null;

  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <Reveal className="w-full">
      <Card className="w-full p-8 text-center">
        <div className="mb-5 flex justify-center">
          <span className="grid h-20 w-20 place-items-center rounded-bezel bg-navy shadow-soft dark:bg-white/10">
            <LogoMark size={34} className="text-white" deltaClassName="fill-accent" />
          </span>
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-navy dark:text-white">
          Tekrar hoş geldin
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Kulüp hesabınla giriş yap. Yalnız izin listesindeki üyeler girebilir.
        </p>
        {hata && (
          <p
            role="alert"
            className="mt-4 rounded-core bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300"
          >
            {hata}
          </p>
        )}
        <div className="mt-6 flex justify-center">
          <Button variant="accent" icon={<ArrowRightIcon size={16} />} onClick={signIn}>
            Google ile giriş yap
          </Button>
        </div>
      </Card>
    </Reveal>
  );
}

export default function LoginPage() {
  return (
    <main className="bg-dotgrid mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-4 sm:px-6">
      <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-bezel bg-black/5 dark:bg-white/5" />}>
        <LoginCard />
      </Suspense>
    </main>
  );
}
