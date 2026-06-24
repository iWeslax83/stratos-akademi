"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { taskReviewMessage, submissionCommentMessage } from "@/lib/notifications/message";
import { taskReviewEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { cleanComment, commentNotifyTarget } from "@/lib/tasks/comment";

export type ActionResult = { ok: boolean; error?: string };

function str(fd: FormData, k: string): string {
  return ((fd.get(k) as string | null) ?? "").trim();
}
function intOr(fd: FormData, k: string, def: number): number {
  const v = parseInt(str(fd, k), 10);
  return Number.isFinite(v) ? v : def;
}
function errMsg(error: { code?: string; message?: string }): string {
  if (error.code === "42501" || /row-level security|permission denied/i.test(error.message ?? "")) {
    return "Bu işlem için yetkin yok.";
  }
  return "İşlem başarısız: " + (error.message ?? "bilinmeyen hata");
}

// ---- ÜYE GÖNDERİMİ ----
export async function submitTask(
  taskId: string,
  icerik: string,
  userId: string,
  dosyaYolu: string | null,
): Promise<ActionResult> {
  try {
    const metin = (icerik ?? "").trim();
    if (!metin && !dosyaYolu) return { ok: false, error: "Link/metin veya dosya gerekli." };
    const supabase = await createClient();
    const { data: mevcut } = await supabase
      .from("task_submissions")
      .select("dosya_yolu")
      .eq("user_id", userId)
      .eq("task_id", taskId)
      .maybeSingle();
    const eskiDosya = (mevcut as { dosya_yolu: string | null } | null)?.dosya_yolu ?? null;
    const { error } = await supabase
      .from("task_submissions")
      .upsert(
        {
          user_id: userId,
          task_id: taskId,
          icerik: metin,
          dosya_yolu: dosyaYolu,
          durum: "beklemede",
          geri_bildirim: null,
          reviewed_by: null,
          reviewed_at: null,
        },
        { onConflict: "user_id,task_id" },
      );
    if (error) return { ok: false, error: errMsg(error) };

    // Yeni dosya eskisinin yerini aldıysa eski Storage dosyasını sil (best-effort, service_role).
    if (eskiDosya && eskiDosya !== dosyaYolu) {
      try {
        const svc = createServiceClient();
        await svc.storage.from("gorev-dosyalari").remove([eskiDosya]);
      } catch (rmErr) {
        console.error("eski dosya silme:", rmErr);
      }
    }

    return { ok: true };
  } catch (e) { console.error("submitTask:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// ---- ADMIN GÖREV TANIMI CRUD ----
export async function createTask(fd: FormData): Promise<ActionResult> {
  try {
    const moduleId = str(fd, "module_id");
    const baslik = str(fd, "baslik");
    if (!moduleId) return { ok: false, error: "module_id eksik." };
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase.from("practical_tasks").insert({
      module_id: moduleId,
      baslik,
      aciklama: str(fd, "aciklama") || null,
      sira: intOr(fd, "sira", 0),
      puan: intOr(fd, "puan", 30),
    });
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("createTask:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function updateTask(fd: FormData): Promise<ActionResult> {
  try {
    const id = str(fd, "id");
    const baslik = str(fd, "baslik");
    if (!id) return { ok: false, error: "id eksik." };
    if (!baslik) return { ok: false, error: "Başlık zorunlu." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("practical_tasks")
      .update({ baslik, aciklama: str(fd, "aciklama") || null, sira: intOr(fd, "sira", 0), puan: intOr(fd, "puan", 30) })
      .eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("updateTask:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

export async function deleteTask(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("practical_tasks").delete().eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true };
  } catch (e) { console.error("deleteTask:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// ---- ADMIN İNCELEME ----
export async function reviewSubmission(
  id: string,
  durum: "onay" | "red",
  geriBildirim: string,
  adminId: string,
): Promise<ActionResult> {
  try {
    const fb = (geriBildirim ?? "").trim();
    if (durum === "red" && !fb) return { ok: false, error: "Reddederken bir not gir." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("task_submissions")
      .update({
        durum,
        geri_bildirim: fb || null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return { ok: false, error: errMsg(error) };

    // Bildirim (best-effort; review akışını bozmaz)
    try {
      const { data: sub } = await supabase
        .from("task_submissions")
        .select("user_id, practical_tasks(baslik, module_id)")
        .eq("id", id)
        .single();
      const ptRaw = (
        sub as {
          practical_tasks:
            | { baslik: string; module_id: string }
            | { baslik: string; module_id: string }[]
            | null;
        } | null
      )?.practical_tasks;
      const pt = Array.isArray(ptRaw) ? ptRaw[0] : ptRaw;
      const uid = (sub as { user_id: string } | null)?.user_id;
      if (uid && pt) {
        await supabase.from("notifications").insert({
          user_id: uid,
          mesaj: taskReviewMessage(durum, pt.baslik),
          link: `/mufredat/gorevler/${pt.module_id}`,
        });

        // E-posta (best-effort; RESEND_API_KEY/MAIL_FROM yoksa atlanır)
        const { data: uyeProfil } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", uid)
          .single();
        const email = (uyeProfil as { email: string } | null)?.email;
        if (email) {
          const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
          const { subject, html } = taskReviewEmail(
            durum,
            pt.baslik,
            `${base}/mufredat/gorevler/${pt.module_id}`,
          );
          await sendEmail({ to: email, subject, html });
        }
      }
    } catch (notifErr) {
      console.error("review notification/email:", notifErr);
    }

    return { ok: true };
  } catch (e) { console.error("reviewSubmission:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}

// ---- GÖNDERİM YORUMU (kaptan ↔ üye thread) ----
export async function addSubmissionComment(
  submissionId: string,
  mesaj: string,
  authorId: string,
): Promise<ActionResult> {
  try {
    const metin = cleanComment(mesaj);
    if (!metin) return { ok: false, error: "Boş yorum gönderilemez." };
    const supabase = await createClient();

    // RLS ekleme iznini doğrular (kendi gönderimi ya da admin).
    const { error } = await supabase
      .from("submission_comments")
      .insert({ submission_id: submissionId, author_id: authorId, mesaj: metin });
    if (error) return { ok: false, error: errMsg(error) };

    // Karşı tarafa bildirim (best-effort; thread'i bozmaz).
    try {
      const { data: amAdmin } = await supabase.rpc("is_admin");
      const { data: sub } = await supabase
        .from("task_submissions")
        .select("user_id, reviewed_by, practical_tasks(baslik, module_id)")
        .eq("id", submissionId)
        .single();
      const s = sub as {
        user_id: string;
        reviewed_by: string | null;
        practical_tasks:
          | { baslik: string; module_id: string }
          | { baslik: string; module_id: string }[]
          | null;
      } | null;
      const ptRaw = s?.practical_tasks;
      const pt = Array.isArray(ptRaw) ? ptRaw[0] : ptRaw;
      if (s && pt) {
        const fromAdmin = amAdmin === true;
        const target = commentNotifyTarget({
          authorId,
          authorIsAdmin: fromAdmin,
          submissionOwnerId: s.user_id,
          reviewedBy: s.reviewed_by,
        });
        if (target) {
          // Hedef üye ise kendi görev sayfasına, kaptan ise onay kuyruğuna yönlendir.
          const link = target === s.user_id ? `/mufredat/gorevler/${pt.module_id}` : "/admin/onaylar";
          await supabase.from("notifications").insert({
            user_id: target,
            mesaj: submissionCommentMessage(pt.baslik, fromAdmin),
            link,
          });
        }
      }
    } catch (notifErr) {
      console.error("comment notification:", notifErr);
    }

    return { ok: true };
  } catch (e) { console.error("addSubmissionComment:", e); return { ok: false, error: "Beklenmeyen hata." }; }
}
