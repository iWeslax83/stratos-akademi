import {
  checkSyncToken,
  isStudentNoConflict,
  parseAllowlistEmail,
  parseApplicantName,
  parseOkulNo,
} from "@/lib/allowlist-sync";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  return checkSyncToken(request.headers.get("authorization"), process.env.ALLOWLIST_SYNC_TOKEN);
}

export async function POST(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ error: "yetkisiz" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | { email?: unknown; okulNo?: unknown; name?: unknown }
    | null;
  const parsed = parseAllowlistEmail(body?.email);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
  const okul = parseOkulNo(body?.okulNo);
  if (!okul.ok) return Response.json({ error: okul.error }, { status: 400 });
  const applicant = parseApplicantName(body?.name);
  if (!applicant.ok) return Response.json({ error: applicant.error }, { status: 400 });
  const name = applicant.name;

  try {
    const svc = createServiceClient();
    const { data: existing, error: readError } = await svc
      .from("allowlist")
      .select("email, student_no, ad")
      .eq("email", parsed.email)
      .maybeSingle();
    if (readError) {
      console.error("allowlist POST read:", readError);
      return Response.json({ error: "kayıt başarısız" }, { status: 500 });
    }

    let studentNo: "skipped_conflict" | "skipped_mismatch" | null = null;

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
          studentNo = "skipped_conflict";
        } else if (error) {
          console.error("allowlist POST update:", error);
          return Response.json({ error: "kayıt başarısız" }, { status: 500 });
        }
      } else if (okul.okulNo && existing.student_no !== null && existing.student_no !== okul.okulNo) {
        console.warn("allowlist POST: kayıtlı numara farklı, ezilmedi");
        studentNo = "skipped_mismatch";
      }
      if (name && existing.ad !== name) {
        const { error } = await svc.from("allowlist").update({ ad: name }).eq("email", parsed.email);
        if (error) {
          console.error("allowlist POST ad:", error);
          return Response.json({ error: "kayıt başarısız" }, { status: 500 });
        }
      }
    } else {
      // Rol her zaman 'uye': token sızsa bile bu uç nokta admin veremez.
      const base = { email: parsed.email, role: "uye", ...(name ? { ad: name } : {}) };
      const { error } = await svc
        .from("allowlist")
        .insert({ ...base, ...(okul.okulNo ? { student_no: okul.okulNo } : {}) });
      if (isStudentNoConflict(error)) {
        // Numara başka üyede: e-posta yine de izin alsın (Google ile girebilsin), numara boş kalır.
        console.error("allowlist POST: okul no başka e-postaya bağlı", okul.okulNo);
        const retry = await svc.from("allowlist").insert(base);
        if (retry.error && retry.error.code !== "23505") {
          console.error("allowlist POST retry:", retry.error);
          return Response.json({ error: "kayıt başarısız" }, { status: 500 });
        }
        studentNo = "skipped_conflict";
      } else if (error && error.code !== "23505") {
        // 23505 (eşzamanlı istek aynı e-postayı ekledi): zaten var, sorun değil.
        console.error("allowlist POST:", error);
        return Response.json({ error: "kayıt başarısız" }, { status: 500 });
      }
    }

    // Hesap zaten açıldıysa görünen ad başvurudaki ad olur (Google adı değil). Hesap yoksa
    // handle_new_user ilk girişte adı allowlist'ten alır.
    if (name) {
      const { error } = await svc.from("profiles").update({ ad: name }).eq("email", parsed.email);
      if (error) {
        console.error("allowlist POST profil adı:", error);
        return Response.json({ error: "kayıt başarısız" }, { status: 500 });
      }
    }

    return Response.json(studentNo ? { ok: true, studentNo } : { ok: true });
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
