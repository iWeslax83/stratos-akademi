import { checkSyncToken, parseAllowlistEmail } from "@/lib/allowlist-sync";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  return checkSyncToken(request.headers.get("authorization"), process.env.ALLOWLIST_SYNC_TOKEN);
}

export async function POST(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ error: "yetkisiz" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = parseAllowlistEmail((body as { email?: unknown } | null)?.email);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  try {
    const svc = createServiceClient();
    // Rol her zaman 'uye': token sızsa bile bu uç nokta admin veremez.
    // Satır zaten varsa (23505) dokunulmaz, kaptanın admin rolü ezilmez.
    const { error } = await svc.from("allowlist").insert({ email: parsed.email, role: "uye" });
    if (error && error.code !== "23505") {
      console.error("allowlist POST:", error);
      return Response.json({ error: "kayıt başarısız" }, { status: 500 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error("allowlist POST:", e);
    return Response.json({ error: "kayıt başarısız" }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ error: "yetkisiz" }, { status: 401 });

  const parsed = parseAllowlistEmail(new URL(request.url).searchParams.get("email"));
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  try {
    const svc = createServiceClient();
    // Hesabı olan kişinin ilerleme/puan verisi bu uç noktayla silinmez.
    const { data: profile, error: readError } = await svc
      .from("profiles")
      .select("id")
      .eq("email", parsed.email)
      .maybeSingle();
    if (readError) {
      console.error("allowlist DELETE read:", readError);
      return Response.json({ error: "silme başarısız" }, { status: 500 });
    }
    if (profile) return Response.json({ ok: true, removed: false, reason: "has_account" });

    // Yalnızca 'uye' satırı silinir: bekleyen bir admin daveti bu uç noktayla
    // (token sızsa bile) kaldırılamaz.
    const { data, error } = await svc
      .from("allowlist")
      .delete()
      .eq("email", parsed.email)
      .eq("role", "uye")
      .select("email");
    if (error) {
      console.error("allowlist DELETE:", error);
      return Response.json({ error: "silme başarısız" }, { status: 500 });
    }
    return Response.json({ ok: true, removed: (data?.length ?? 0) > 0 });
  } catch (e) {
    console.error("allowlist DELETE:", e);
    return Response.json({ error: "silme başarısız" }, { status: 500 });
  }
}
