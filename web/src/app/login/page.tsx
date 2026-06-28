"use client";

import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

export default function LoginPage() {
  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6">
      <Card className="w-full p-8 text-center">
        <Eyebrow>Stratos Akademi</Eyebrow>
        <h1 className="mt-4 font-display text-2xl font-bold text-navy dark:text-white">
          Tekrar hoş geldin
        </h1>
        <p className="mt-2 text-sm text-muted">
          Kulüp hesabınla giriş yap. Yalnız izin listesindeki üyeler girebilir.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="gold" icon="→" onClick={signIn}>
            Google ile giriş yap
          </Button>
        </div>
      </Card>
    </main>
  );
}
