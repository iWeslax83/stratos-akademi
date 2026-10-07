import { clientIp, consumeAttempt, verifyTurnstile } from "@/lib/auth/student-login";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizeStudentNo } from "@/lib/student-no";

export const dynamic = "force-dynamic";

// Tek genel mesaj: numara taraması ve "bu numara admine ait" çıkarımı kolaylaşmasın.
const GENERIC = "Numara bulunamadı veya giriş yapılamadı.";
const FAIL = "Giriş şu an yapılamıyor. Biraz sonra tekrar dene.";

const fail = (error: string, status: number) => Response.json({ error }, { status });

export async function POST(request: Request): Promise<Response> {
  // Login CSRF: başka bir site kurbanı saldırganın numarasıyla oturuma sokmasın. Deneme hakkı
  // tüketmeden en başta reddedilir.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let sameOrigin = false;
  try {
    sameOrigin = !!origin && !!host && new URL(origin).host === host;
  } catch {
    sameOrigin = false;
  }
  if (!sameOrigin) return fail(GENERIC, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return fail(GENERIC, 415);
  }

  const ip = clientIp(request.headers);
  const body = (await request.json().catch(() => null)) as { studentNo?: unknown; token?: unknown } | null;

  const studentNo = normalizeStudentNo(body?.studentNo);
  if (!studentNo) return fail("Öğrenci numarası yalnız rakamlardan oluşmalı.", 400);

  try {
    const svc = createServiceClient();

    const attempt = await consumeAttempt(svc, ip, studentNo);
    if (attempt === "limited") return fail("Çok fazla deneme. Biraz sonra tekrar dene.", 429);
    if (attempt === "error") return fail(FAIL, 500);

    const human = await verifyTurnstile(body?.token, ip, process.env.TURNSTILE_SECRET_KEY);
    if (!human) return fail("Captcha doğrulanamadı. Sayfayı yenileyip tekrar dene.", 400);

    const { data: allow, error: allowError } = await svc
      .from("allowlist")
      .select("email, role")
      .eq("student_no", studentNo)
      .maybeSingle();
    if (allowError) {
      console.error("student login allowlist:", allowError);
      return fail(FAIL, 500);
    }
    if (!allow || allow.role === "admin") return fail(GENERIC, 401);

    const { data: profile, error: profileError } = await svc
      .from("profiles")
      .select("id, role")
      .eq("email", allow.email)
      .maybeSingle();
    if (profileError) {
      console.error("student login profile:", profileError);
      return fail(FAIL, 500);
    }
    // Roller ayrışmış olsa bile admin numarayla girmez.
    if (profile?.role === "admin") return fail(GENERIC, 401);

    if (!profile) {
      // handle_new_user tetikleyicisi allowlist'e bakıp profili açar. Eşzamanlı istek aynı
      // kullanıcıyı açtıysa "already" hatası zararsızdır.
      const { error } = await svc.auth.admin.createUser({ email: allow.email, email_confirm: true });
      if (error && !/already|registered|exists/i.test(error.message)) {
        console.error("student login createUser:", error);
        return fail(FAIL, 500);
      }
    }

    const { data: link, error: linkError } = await svc.auth.admin.generateLink({
      type: "magiclink",
      email: allow.email,
    });
    const tokenHash = link?.properties?.hashed_token;
    if (linkError || !tokenHash) {
      console.error("student login generateLink:", linkError);
      return fail(FAIL, 500);
    }

    // Üyeler profiles.email'i düzenleyebilir; admin kontrolü gerçek kullanıcı id'siyle de yapılır.
    const uid = link?.user?.id;
    if (!uid) {
      console.error("student login: link without user");
      return fail(FAIL, 500);
    }
    const { data: who, error: whoErr } = await svc.from("profiles").select("role").eq("id", uid).maybeSingle();
    if (whoErr) {
      console.error("student login profile by id:", whoErr);
      return fail(FAIL, 500);
    }
    if (!who || who.role === "admin") return fail(GENERIC, 401);

    // Oturum çerezlerini bu istekte sunucu istemcisi koyar.
    const supabase = await createClient();
    const { error: otpError } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
    if (otpError) {
      console.error("student login verifyOtp:", otpError);
      return fail(FAIL, 500);
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error("student login:", e);
    return fail(FAIL, 500);
  }
}
