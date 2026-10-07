"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { ArrowRightIcon } from "@/components/ui/icons";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";

export function StudentLoginForm() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [no, setNo] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  if (!siteKey) {
    return <p className="text-sm leading-6 text-muted">Numara ile giriş şu an kapalı. Google ile giriş yapabilirsin.</p>;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token || !no) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/auth/student", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentNo: no, token }),
      });
      if (res.ok) {
        // Tam sayfa geçişi: yeni oturum çerezi proxy'ye ilk istekte gitsin.
        window.location.assign("/panom");
        return;
      }
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(json?.error ?? "Giriş yapılamadı. Tekrar dene.");
    } catch {
      setError("Bağlantı kurulamadı. Tekrar dene.");
    }
    // Captcha token'ı tek kullanımlık: yeniden çözülmeli.
    setToken(null);
    setResetKey((k) => k + 1);
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4 text-left" noValidate>
      <div>
        <label htmlFor="student-no" className="block text-sm font-semibold text-fg">
          Öğrenci numarası
        </label>
        <input
          id="student-no"
          name="studentNo"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          value={no}
          onChange={(e) => setNo(e.target.value.replace(/\D/g, ""))}
          className="mt-1.5 w-full rounded-core border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>
      <TurnstileWidget siteKey={siteKey} onToken={setToken} resetKey={resetKey} />
      <FormError box>{error}</FormError>
      <div className="flex justify-center">
        <Button
          type="submit"
          variant="accent"
          icon={<ArrowRightIcon size={16} />}
          loading={loading}
          disabled={!token || no.length === 0}
        >
          Giriş yap
        </Button>
      </div>
    </form>
  );
}
