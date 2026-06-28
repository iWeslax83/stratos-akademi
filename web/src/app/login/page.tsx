"use client";

import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

export default function LoginPage() {
  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="bg-dotgrid mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6">
      <Reveal className="w-full">
        <Card className="w-full p-8 text-center">
          <div className="mb-5 flex justify-center">
            <span className="grid h-12 w-12 place-items-center rounded-bezel bg-navy text-2xl text-gold shadow-soft dark:bg-white/10">
              ◆
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
            <Button variant="gold" icon="→" onClick={signIn}>
              Google ile giriş yap
            </Button>
          </div>
        </Card>
      </Reveal>
    </main>
  );
}
