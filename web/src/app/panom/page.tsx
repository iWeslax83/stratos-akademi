import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";

export default async function PanomPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("ad, email, role")
    .eq("id", user!.id)
    .single();

  const ad = profile?.ad ?? profile?.email ?? "üye";
  const initial = (profile?.ad ?? profile?.email ?? "E").charAt(0).toUpperCase();

  return (
    <AppShell initial={initial}>
      <div className="mb-4">
        <Eyebrow>Panom</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-bold text-navy dark:text-white">
          Tekrar hoş geldin, {ad} 👋
        </h1>
        <p className="mt-1.5 text-muted">Müfredat ve ilerleme yakında burada olacak.</p>
      </div>
      <Card className="p-6">
        <p className="text-sm text-muted">
          Giriş başarılı. Rolün: <b className="text-navy dark:text-white">{profile?.role}</b>. Bu
          ekran sonraki planda gerçek dashboard ile değiştirilecek.
        </p>
      </Card>
    </AppShell>
  );
}
