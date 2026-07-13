"use client";

import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { LogoMark } from "@/components/brand/LogoMark";

export default function LoginPage() {
  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="bg-dotgrid mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-4 sm:px-6">
      <Reveal className="w-full">
        <Card className="w-full p-8 text-center">
          <div className="mb-5 flex justify-center">
            <span className="grid h-20 w-20 place-items-center rounded-bezel bg-navy shadow-soft dark:bg-white/10">
              <LogoMark size={34} className="text-white" deltaClassName="fill-accent" />
            </span>
          </div>
          <Eyebrow>Stratos Akademi</Eyebrow>
          <h1 className="mt-4 font-display text-2xl font-bold text-navy dark:text-white">
            Tekrar hoş geldin
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Kulüp hesabınla giriş yap. Yalnız izin listesindeki üyeler girebilir.
          </p>
          <div className="mt-6 flex justify-center">
            <Button variant="accent" icon="→" onClick={signIn}>
              Google ile giriş yap
            </Button>
          </div>
        </Card>
      </Reveal>
    </main>
  );
}
