import { checkSyncToken, isStudentNoConflict, parseAllowlistEmail, parseOkulNo } from "@/lib/allowlist-sync";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  return checkSyncToken(request.headers.get("authorization"), process.env.ALLOWLIST_SYNC_TOKEN);
}

export async function POST(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ error: "yetkisiz" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { email?: unknown; okulNo?: unknown } | null;
  const parsed = parseAllowlistEmail(body?.email);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
  const okul = parseOkulNo(body?.okulNo);
  if (!okul.ok) return Response.json({ error: okul.error }, { status: 400 });

  try {
    const svc = createServiceClient();
    const { data: existing, error: readError } = await svc
      .from("allowlist")
      .select("email, student_no")
      .eq("email", parsed.email)
      .maybeSingle();
    if (readError) {
      console.error("allowlist POST read:", readError);
      return Response.json({ error: "kayıt başarısız" }, { status: 500 });
    }

    if (existing) {
      // Satır varsa rol ve diğer alanlara dokunulmaz. İlk yazan kazanır: e-postalar doğrulanmadığı
      // için kayıtlı bir numara asla ezilmez (yoksa başkası üyenin numarasını değiştirip onun
      // hesabına girebilir). Yalnız boş numara doldurulur.
      if (okul.okulNo && existing.student_no === null) {
        const { error } = await svc
          .from("allowlist")
          .update({ student_no: okul.okulNo })
          .eq("email", parsed.email)
          .is("student_no", null);
        if (isStudentNoConflict(error)) {
          console.error("allowlist POST: okul no başka e-postaya bağlı", okul.okulNo);
          return Response.json({ ok: true, studentNo: "skipped_conflict" });
        }
        if (error) {
          console.error("allowlist POST update:", error);
          return Response.json({ error: "kayıt başarısız" }, { status: 500 });
        }
      } else if (okul.okulNo && existing.student_no !== null && existing.student_no !== okul.okulNo) {
        console.warn("allowlist POST: kayıtlı numara farklı, ezilmedi");
        return Response.json({ ok: true, studentNo: "skipped_mismatch" });
      }
      return Response.json({ ok: true });
    }

    // Rol her zaman 'uye': token sızsa bile bu uç nokta admin veremez.
    const row = { email: parsed.email, role: "uye", ...(okul.okulNo ? { student_no: okul.okulNo } : {}) };
    const { error } = await svc.from("allowlist").insert(row);
    if (isStudentNoConflict(error)) {
      // Numara başka üyede: e-posta yine de izin alsın (Google ile girebilsin), numara boş kalır.
      console.error("allowlist POST: okul no başka e-postaya bağlı", okul.okulNo);
      const retry = await svc.from("allowlist").insert({ email: parsed.email, role: "uye" });
      if (retry.error && retry.error.code !== "23505") {
        console.error("allowlist POST retry:", retry.error);
        return Response.json({ error: "kayıt başarısız" }, { status: 500 });
      }
      return Response.json({ ok: true, studentNo: "skipped_conflict" });
    }
    // 23505 (eşzamanlı istek aynı e-postayı ekledi): zaten var, sorun değil.
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
