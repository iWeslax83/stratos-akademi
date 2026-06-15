# Stratos Akademi — v1 Temel (Foundation) Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js + Supabase tabanlı eğitim platformunun temelini kur: Google ile giriş (e-posta izin listesiyle kısıtlı), açık/koyu temalı uygulama kabuğu ve tasarım sistemi bileşenleri.

**Architecture:** Next.js App Router (TypeScript) + Tailwind CSS arayüz; Supabase (Postgres + Auth + RLS) backend. Kimlik doğrulama `@supabase/ssr` ile sunucu/istemci/middleware üçlüsünde yönetilir. Korunan rotalara yalnızca `allowlist` tablosundaki e-postalar girebilir. Tasarım dili spec'teki sisteme dayanır (Sora/Plus Jakarta Sans, lacivert+altın, double-bezel kartlar).

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS 3, @supabase/supabase-js, @supabase/ssr, Vitest + @testing-library/react (birim/bileşen testleri).

**Spec:** `docs/superpowers/specs/2026-06-15-stratos-akademi-design.md`

---

## Dosya Yapısı (bu planda oluşturulacak/değişecek)

```
web/                                   # Next.js uygulaması (proje kökünün altında)
  package.json
  next.config.ts
  tsconfig.json
  vitest.config.ts
  vitest.setup.ts
  tailwind.config.ts
  postcss.config.mjs
  .env.local.example
  src/
    app/
      layout.tsx                       # kök layout, fontlar, ThemeProvider
      globals.css                      # Tailwind + CSS değişkenleri (açık/koyu)
      page.tsx                         # ana sayfa → /panom'a yönlendirir
      login/page.tsx                   # Google ile giriş ekranı
      panom/page.tsx                   # korumalı yer-tutucu dashboard (kabuk testi)
      auth/callback/route.ts           # OAuth callback
      auth/signout/route.ts            # çıkış
    components/
      ui/Card.tsx                      # double-bezel Shell+Core
      ui/Button.tsx                    # pill buton + buton-içinde-buton ikon
      ui/Eyebrow.tsx                   # eyebrow etiket
      ui/Chip.tsx                      # üst bar chip'leri
      shell/Nav.tsx                    # yüzen cam navigasyon + tema düğmesi
      shell/AppShell.tsx               # sayfa kabuğu (nav + içerik)
      theme/ThemeProvider.tsx          # tema context (localStorage + html.class)
      theme/ThemeToggle.tsx            # ☀️/🌙 düğmesi
    lib/
      supabase/client.ts               # tarayıcı Supabase client
      supabase/server.ts               # sunucu Supabase client
      auth/allowlist.ts                # izin listesi saf mantık + sorgu
    middleware.ts                      # oturum yenileme + rota koruma
    test/
      lib/allowlist.test.ts
      components/Button.test.tsx
      components/Card.test.tsx
      theme/ThemeProvider.test.tsx
supabase/
  migrations/0001_foundation.sql       # profiles + allowlist + RLS + trigger
```

**Kural:** Tüm komutlar `web/` klasörü içinden çalıştırılır (aksi belirtilmedikçe). Sürüm kontrolü proje kökündeki mevcut git deposudur.

---

### Task 1: Next.js projesini iskele olarak kur

**Files:**
- Create: `web/` (Next.js scaffold)

- [ ] **Step 1: Next.js projesini oluştur**

Proje kökünden (`/home/weslax83/Desktop/İHA TAKIMI`) çalıştır:

```bash
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

Sorulursa varsayılanları kabul et.

- [ ] **Step 2: Tailwind'i v3'e sabitle**

`create-next-app@latest` artık Tailwind v4 kurabilir. Bu plan v3 yapısını (`tailwind.config.ts` + `@tailwind` direktifleri) kullanır. v3'e sabitle:

```bash
cd web && npm uninstall tailwindcss @tailwindcss/postcss 2>/dev/null; npm install -D tailwindcss@^3 postcss autoprefixer
```

`web/postcss.config.mjs` dosyasını şu içerikle değiştir:

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

Doğrulama: `cd web && npm ls tailwindcss` çıktısında `tailwindcss@3.x.x` görünür.

Not: `tailwind.config.ts` ve `globals.css` içeriği Task 3'te bu plana göre baştan yazılacak; scaffold'un ürettiği varsayılanları ezecektir.

- [ ] **Step 3: Dev sunucusunun açıldığını doğrula**

```bash
cd web && npm run dev
```

Expected: Terminalde `Local: http://localhost:3000` görünür. `Ctrl+C` ile kapat.

- [ ] **Step 4: Üretim derlemesini doğrula**

Run: `cd web && npm run build`
Expected: `Compiled successfully` ile biter, hata yok.

- [ ] **Step 5: Commit**

```bash
git add web .gitignore
git commit -m "feat: scaffold Next.js app (web/) with Tailwind v3"
```

---

### Task 2: Test altyapısını kur (Vitest + Testing Library)

**Files:**
- Create: `web/vitest.config.ts`, `web/vitest.setup.ts`
- Modify: `web/package.json` (scripts)
- Test: `web/src/test/smoke.test.ts`

- [ ] **Step 1: Test bağımlılıklarını kur**

```bash
cd web && npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Vitest yapılandırmasını yaz**

Create `web/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/test/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

Create `web/vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: package.json'a test script ekle**

`web/package.json` içindeki `"scripts"` bloğuna ekle:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Smoke testi yaz**

Create `web/src/test/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("test altyapısı", () => {
  it("çalışıyor", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Testi çalıştır ve geçtiğini doğrula**

Run: `cd web && npm test`
Expected: `1 passed` (smoke testi geçer).

- [ ] **Step 6: Commit**

```bash
git add web/vitest.config.ts web/vitest.setup.ts web/package.json web/package-lock.json web/src/test/smoke.test.ts
git commit -m "test: add vitest + testing-library setup"
```

---

### Task 3: Tasarım token'ları ve fontlar

**Files:**
- Modify: `web/tailwind.config.ts`
- Modify: `web/src/app/globals.css`
- Modify: `web/src/app/layout.tsx`

- [ ] **Step 1: Tailwind temasına marka renklerini ekle**

`web/tailwind.config.ts` dosyasını şu içerikle değiştir:

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#16243f", deep: "#0d1526", panel: "#111c33" },
        gold: { DEFAULT: "#c9a23a", soft: "#f6ecca", dark: "#3a2f0e" },
        ink: "#0f1a30",
        muted: "#64708a",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
      },
      borderRadius: { bezel: "26px", core: "20px" },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 2: globals.css'e açık/koyu CSS değişkenlerini ekle**

`web/src/app/globals.css` dosyasını şu içerikle değiştir:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #eef1f6;
  --panel: #ffffff;
  --text: #0f1a30;
  --muted: #64708a;
  --line: rgba(15, 26, 48, 0.08);
}

.dark {
  --bg: #070d18;
  --panel: #111c33;
  --text: #e4ecf8;
  --muted: #8294b0;
  --line: rgba(255, 255, 255, 0.07);
}

body {
  background:
    radial-gradient(900px 420px at 85% -10%, rgba(201, 162, 58, 0.1), transparent 60%),
    radial-gradient(800px 500px at -5% 110%, rgba(22, 36, 63, 0.1), transparent 55%),
    var(--bg);
  color: var(--text);
  min-height: 100dvh;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 3: Fontları layout.tsx'te yükle**

`web/src/app/layout.tsx` dosyasını şu içerikle değiştir:

```tsx
import type { Metadata } from "next";
import { Sora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["400", "600", "700", "800"] });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Stratos Akademi",
  description: "Stratos / TMT-İHA kulübü eğitim platformu",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${sora.variable} ${jakarta.variable} font-sans`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

Not: `ThemeProvider` Task 4'te oluşturulur. Bu adımdan sonra Task 4 bitene kadar derleme başarısız olabilir — Task 4 ile birlikte tamamlanır.

- [ ] **Step 4: Commit (Task 4 ile birlikte derlenecek)**

```bash
git add web/tailwind.config.ts web/src/app/globals.css web/src/app/layout.tsx
git commit -m "feat: add brand design tokens and fonts"
```

---

### Task 4: Tema sağlayıcı (açık/koyu) — TDD

**Files:**
- Create: `web/src/components/theme/ThemeProvider.tsx`
- Create: `web/src/components/theme/ThemeToggle.tsx`
- Test: `web/src/test/theme/ThemeProvider.test.tsx`

- [ ] **Step 1: Başarısız testi yaz**

Create `web/src/test/theme/ThemeProvider.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("ThemeProvider", () => {
  it("varsayılan açık temayla başlar (html.dark yok)", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("düğmeye tıklayınca koyu temaya geçer ve localStorage'a yazar", async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: /tema/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("stratos-theme")).toBe("dark");
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `cd web && npx vitest run src/test/theme/ThemeProvider.test.tsx`
Expected: FAIL — modüller bulunamadı (`ThemeProvider`/`ThemeToggle` yok).

- [ ] **Step 3: ThemeProvider'ı uygula**

Create `web/src/components/theme/ThemeProvider.tsx`:

```tsx
"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";
type ThemeCtx = { theme: Theme; toggle: () => void };

const Ctx = createContext<ThemeCtx | null>(null);
const KEY = "stratos-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Theme | null) ?? "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(KEY, next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme, ThemeProvider içinde kullanılmalı");
  return ctx;
}
```

- [ ] **Step 4: ThemeToggle'ı uygula**

Create `web/src/components/theme/ThemeToggle.tsx`:

```tsx
"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Tema değiştir"
      className="grid h-9 w-9 place-items-center rounded-full bg-black/5 text-navy hover:bg-black/10 dark:bg-white/10 dark:text-white"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
```

- [ ] **Step 5: Testin geçtiğini doğrula**

Run: `cd web && npx vitest run src/test/theme/ThemeProvider.test.tsx`
Expected: PASS (2 test).

- [ ] **Step 6: Derlemeyi doğrula**

Run: `cd web && npm run build`
Expected: `Compiled successfully`.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/theme web/src/test/theme
git commit -m "feat: add light/dark ThemeProvider and toggle (TDD)"
```

---

### Task 5: UI bileşenleri — Card (double-bezel) ve Button — TDD

**Files:**
- Create: `web/src/components/ui/Card.tsx`
- Create: `web/src/components/ui/Button.tsx`
- Test: `web/src/test/components/Card.test.tsx`, `web/src/test/components/Button.test.tsx`

- [ ] **Step 1: Başarısız testleri yaz**

Create `web/src/test/components/Card.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "@/components/ui/Card";

describe("Card", () => {
  it("çocuk içeriği bir iç çekirdek (core) içinde gösterir", () => {
    render(
      <Card>
        <span>içerik</span>
      </Card>,
    );
    const child = screen.getByText("içerik");
    // dış kabuk > iç çekirdek > içerik
    const core = child.parentElement!;
    const shell = core.parentElement!;
    expect(core).toHaveClass("rounded-core");
    expect(shell).toHaveClass("rounded-bezel");
  });
});
```

Create `web/src/test/components/Button.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("etiketi gösterir ve tıklamayı iletir", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Devam et</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Devam et" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("icon verilince buton-içinde-buton yuvasını render eder", () => {
    render(<Button icon="→">Sonraki</Button>);
    expect(screen.getByTestId("btn-icon")).toHaveTextContent("→");
  });
});
```

- [ ] **Step 2: Testlerin başarısız olduğunu doğrula**

Run: `cd web && npx vitest run src/test/components/Card.test.tsx src/test/components/Button.test.tsx`
Expected: FAIL — `Card`/`Button` modülleri yok.

- [ ] **Step 3: Card'ı uygula**

Create `web/src/components/ui/Card.tsx`:

```tsx
import { clsx } from "clsx";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="rounded-bezel border border-[var(--line)] bg-black/[0.04] p-[7px] dark:bg-white/[0.03]">
      <div
        className={clsx(
          "rounded-core bg-[var(--panel)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Button'ı uygula**

Create `web/src/components/ui/Button.tsx`:

```tsx
import { clsx } from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "gold";
  icon?: React.ReactNode;
};

export function Button({ children, variant = "primary", icon, className, ...rest }: Props) {
  const base =
    "inline-flex items-center gap-2.5 font-display font-semibold text-sm rounded-full transition-transform duration-300 active:scale-[0.98] cursor-pointer";
  const pad = icon ? "pl-5 pr-3 py-3" : "px-5 py-3";
  const variants = {
    primary: "bg-navy text-white",
    gold: "bg-gold text-navy",
    ghost: "bg-black/[0.06] text-navy dark:bg-white/10 dark:text-white",
  } as const;

  return (
    <button className={clsx(base, pad, variants[variant], className)} {...rest}>
      <span>{children}</span>
      {icon != null && (
        <span
          data-testid="btn-icon"
          className="grid h-[30px] w-[30px] place-items-center rounded-full bg-white/20"
        >
          {icon}
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 5: clsx bağımlılığını kur**

```bash
cd web && npm install clsx
```

- [ ] **Step 6: Testlerin geçtiğini doğrula**

Run: `cd web && npx vitest run src/test/components/Card.test.tsx src/test/components/Button.test.tsx`
Expected: PASS (3 test).

- [ ] **Step 7: Commit**

```bash
git add web/src/components/ui web/src/test/components web/package.json web/package-lock.json
git commit -m "feat: add Card (double-bezel) and Button UI components (TDD)"
```

---

### Task 6: Eyebrow, Chip ve uygulama kabuğu (Nav + AppShell)

**Files:**
- Create: `web/src/components/ui/Eyebrow.tsx`, `web/src/components/ui/Chip.tsx`
- Create: `web/src/components/shell/Nav.tsx`, `web/src/components/shell/AppShell.tsx`

- [ ] **Step 1: Eyebrow'u uygula**

Create `web/src/components/ui/Eyebrow.tsx`:

```tsx
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-gold-soft px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a6d12] dark:bg-gold-dark dark:text-[#ffd54a]">
      {children}
    </span>
  );
}
```

- [ ] **Step 2: Chip'i uygula**

Create `web/src/components/ui/Chip.tsx`:

```tsx
import { clsx } from "clsx";

export function Chip({ children, gold = false }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <span
      className={clsx(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
        gold
          ? "bg-gold-soft text-[#8a6d12] dark:bg-gold-dark dark:text-[#ffd54a]"
          : "bg-black/5 text-navy dark:bg-white/[0.06] dark:text-[#dbe4f3]",
      )}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 3: Nav'ı uygula**

Create `web/src/components/shell/Nav.tsx`:

```tsx
import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function Nav({ initial = "E" }: { initial?: string }) {
  return (
    <nav className="flex items-center gap-4 rounded-full border border-white/60 bg-white/70 px-4 py-3 shadow-[0_12px_30px_-18px_rgba(16,28,55,0.35)] backdrop-blur-md dark:border-white/10 dark:bg-[rgba(20,32,56,0.6)]">
      <Link href="/panom" className="flex items-center gap-2 font-display text-base font-extrabold text-navy dark:text-white">
        <span className="text-gold">◆</span> STRATOS
        <span className="text-sm font-semibold text-muted">akademi</span>
      </Link>
      <div className="ml-auto flex items-center gap-2.5">
        <Chip>🔥 0 gün</Chip>
        <Chip gold>⭐ 0 puan</Chip>
        <ThemeToggle />
        <span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-sm font-bold text-white dark:bg-gold dark:text-navy">
          {initial}
        </span>
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: AppShell'i uygula**

Create `web/src/components/shell/AppShell.tsx`:

```tsx
import { Nav } from "./Nav";

export function AppShell({ children, initial }: { children: React.ReactNode; initial?: string }) {
  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-12 pt-6">
      <Nav initial={initial} />
      <main className="mt-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 5: Derlemeyi doğrula**

Run: `cd web && npm run build`
Expected: `Compiled successfully`.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/ui web/src/components/shell
git commit -m "feat: add Eyebrow, Chip, Nav and AppShell"
```

---

### Task 7: Supabase istemcileri ve ortam değişkenleri

**Files:**
- Create: `web/src/lib/supabase/client.ts`, `web/src/lib/supabase/server.ts`
- Create: `web/.env.local.example`
- Modify: `web/.env.local` (yerelde, commit edilmez)

- [ ] **Step 1: Supabase paketlerini kur**

```bash
cd web && npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Örnek ortam dosyasını oluştur**

Create `web/.env.local.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

- [ ] **Step 3: Gerçek .env.local'i oluştur**

Supabase panelinde proje açtıktan sonra (Project Settings → API), değerleri kopyala:

```bash
cd web && cp .env.local.example .env.local
# .env.local içindeki YOUR-* değerlerini gerçek proje URL'i ve anon key ile değiştir
```

Doğrulama: `cat web/.env.local` çıktısında gerçek `https://...supabase.co` ve anon key görünmeli. `.env.local`, `.gitignore` sayesinde commit edilmez.

- [ ] **Step 4: Tarayıcı istemcisini yaz**

Create `web/src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 5: Sunucu istemcisini yaz**

Create `web/src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component'ten çağrıldıysa yok sayılır; middleware oturumu yeniler.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 6: Derlemeyi doğrula**

Run: `cd web && npm run build`
Expected: `Compiled successfully`.

- [ ] **Step 7: Commit**

```bash
git add web/src/lib/supabase web/.env.local.example web/package.json web/package-lock.json
git commit -m "feat: add Supabase browser/server clients and env example"
```

---

### Task 8: Veritabanı şeması — profiles + allowlist + RLS

**Files:**
- Create: `supabase/migrations/0001_foundation.sql`

- [ ] **Step 1: Migration SQL'ini yaz**

Create `supabase/migrations/0001_foundation.sql` (proje kökünde):

```sql
-- İzin listesi: kimler giriş yapabilir + rolleri
create table if not exists public.allowlist (
  email text primary key,
  role  text not null default 'uye' check (role in ('uye', 'admin')),
  created_at timestamptz not null default now()
);

-- Üye profilleri (auth.users ile 1:1)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  ad text,
  role text not null default 'uye' check (role in ('uye', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.allowlist enable row level security;
alter table public.profiles enable row level security;

-- Profiller: herkes (giriş yapmış) okur; kişi kendi profilini günceller.
create policy "profiller herkese okunur"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "kendi profilini günceller"
  on public.profiles for update
  using (auth.uid() = id);

-- Allowlist: sadece adminler okur/yazar (yeni kullanıcı kontrolü SECURITY DEFINER fonksiyonla yapılır).
create policy "allowlist adminlere okunur"
  on public.allowlist for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Yeni auth kullanıcısı geldiğinde: izin listesinde mi diye bak, değilse profili oluşturma.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  allowed_role text;
begin
  select role into allowed_role from public.allowlist where email = new.email;
  if allowed_role is null then
    raise exception 'Bu e-posta izin listesinde değil: %', new.email;
  end if;
  insert into public.profiles (id, email, ad, role, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    allowed_role,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Migration'ı Supabase'e uygula**

Supabase panelinde **SQL Editor**'ü aç, `supabase/migrations/0001_foundation.sql` içeriğini yapıştır ve **Run**'a bas.
Expected: "Success. No rows returned".

- [ ] **Step 3: Kendi e-postanı admin olarak izin listesine ekle**

Supabase SQL Editor'de çalıştır (kendi Google e-postanla):

```sql
insert into public.allowlist (email, role) values ('emirsakarya00@gmail.com', 'admin')
on conflict (email) do update set role = 'admin';
```

Expected: "Success".

- [ ] **Step 4: Tabloların oluştuğunu doğrula**

Supabase panelinde **Table Editor** → `allowlist` ve `profiles` tabloları görünür; `allowlist`'te bir admin satırı var.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0001_foundation.sql
git commit -m "feat: add foundation DB schema (profiles, allowlist, RLS, trigger)"
```

---

### Task 9: İzin listesi yardımcı mantığı — TDD

**Files:**
- Create: `web/src/lib/auth/allowlist.ts`
- Test: `web/src/test/lib/allowlist.test.ts`

- [ ] **Step 1: Başarısız testi yaz**

Create `web/src/test/lib/allowlist.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { normalizeEmail, isAllowed } from "@/lib/auth/allowlist";

describe("normalizeEmail", () => {
  it("küçük harfe çevirir ve boşlukları kırpar", () => {
    expect(normalizeEmail("  Emir@Gmail.COM ")).toBe("emir@gmail.com");
  });
});

describe("isAllowed", () => {
  const list = ["admin@stratos.com", "uye@stratos.com"];
  it("listedeki e-posta için true döner (büyük/küçük harf duyarsız)", () => {
    expect(isAllowed("ADMIN@stratos.com", list)).toBe(true);
  });
  it("listede olmayan için false döner", () => {
    expect(isAllowed("yabanci@x.com", list)).toBe(false);
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `cd web && npx vitest run src/test/lib/allowlist.test.ts`
Expected: FAIL — `@/lib/auth/allowlist` yok.

- [ ] **Step 3: Mantığı uygula**

Create `web/src/lib/auth/allowlist.ts`:

```ts
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAllowed(email: string, allowlist: string[]): boolean {
  const e = normalizeEmail(email);
  return allowlist.some((a) => normalizeEmail(a) === e);
}
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `cd web && npx vitest run src/test/lib/allowlist.test.ts`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/auth web/src/test/lib
git commit -m "feat: add allowlist helper logic (TDD)"
```

---

### Task 10: Google ile giriş ekranı + OAuth callback + çıkış

**Files:**
- Create: `web/src/app/login/page.tsx`
- Create: `web/src/app/auth/callback/route.ts`
- Create: `web/src/app/auth/signout/route.ts`

- [ ] **Step 1: Giriş ekranını yaz**

Create `web/src/app/login/page.tsx`:

```tsx
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
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6">
      <Card className="w-full p-8 text-center">
        <Eyebrow>Stratos Akademi</Eyebrow>
        <h1 className="mt-4 font-display text-2xl font-bold text-navy dark:text-white">
          Tekrar hoş geldin 👋
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
    </div>
  );
}
```

- [ ] **Step 2: OAuth callback rotasını yaz**

Create `web/src/app/auth/callback/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/panom`);
    }
    // İzin listesinde olmayan kullanıcı trigger'da reddedilir → hata ile login'e dön.
    return NextResponse.redirect(`${origin}/login?error=not_allowed`);
  }
  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
```

- [ ] **Step 3: Çıkış rotasını yaz**

Create `web/src/app/auth/signout/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url), { status: 302 });
}
```

- [ ] **Step 4: Derlemeyi doğrula**

Run: `cd web && npm run build`
Expected: `Compiled successfully`.

- [ ] **Step 5: Commit**

```bash
git add web/src/app/login web/src/app/auth
git commit -m "feat: add Google login screen, OAuth callback and signout"
```

---

### Task 11: Middleware ile oturum yenileme + rota koruma

**Files:**
- Create: `web/src/middleware.ts`

- [ ] **Step 1: Middleware'i yaz**

Create `web/src/middleware.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/login", "/auth"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
```

- [ ] **Step 2: Derlemeyi doğrula**

Run: `cd web && npm run build`
Expected: `Compiled successfully`.

- [ ] **Step 3: Commit**

```bash
git add web/src/middleware.ts
git commit -m "feat: add auth middleware (session refresh + route protection)"
```

---

### Task 12: Korumalı yer-tutucu dashboard + ana sayfa yönlendirme + uçtan uca doğrulama

**Files:**
- Create: `web/src/app/panom/page.tsx`
- Modify: `web/src/app/page.tsx`

- [ ] **Step 1: Ana sayfayı /panom'a yönlendir**

`web/src/app/page.tsx` dosyasını şu içerikle değiştir:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/panom");
}
```

- [ ] **Step 2: Korumalı dashboard yer-tutucusunu yaz**

Create `web/src/app/panom/page.tsx`:

```tsx
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
```

- [ ] **Step 3: Google OAuth'u Supabase'de etkinleştir**

Supabase paneli → **Authentication → Providers → Google**'ı aç. Google Cloud Console'da bir OAuth 2.0 Client ID oluştur; **Authorized redirect URI** olarak Supabase'in verdiği `https://YOUR-PROJECT.supabase.co/auth/v1/callback` adresini ekle. Client ID ve Secret'i Supabase'e gir, kaydet.

Doğrulama: Supabase Google provider'ı "Enabled" görünür.

- [ ] **Step 4: Uçtan uca elle doğrula**

```bash
cd web && npm run dev
```

Tarayıcıda `http://localhost:3000` aç:
- Giriş yapılmamışken `/login`'e yönlenir.
- "Google ile giriş yap" → kendi (izin listesindeki admin) e-postanla giriş → `/panom`'a döner ve "Tekrar hoş geldin, …" + rol `admin` görünür.
- ☀️/🌙 düğmesi temayı değiştirir.
- İzin listesinde **olmayan** bir e-posta denenirse `/login?error=not_allowed`'a döner (giriş reddedilir).

Expected: Tüm maddeler beklendiği gibi çalışır.

- [ ] **Step 5: Tüm testleri ve derlemeyi son kez çalıştır**

Run: `cd web && npm test && npm run build`
Expected: Tüm testler PASS, derleme `Compiled successfully`.

- [ ] **Step 6: Commit**

```bash
git add web/src/app/page.tsx web/src/app/panom
git commit -m "feat: add protected dashboard placeholder and home redirect"
```

---

## Plan Tamamlandı — Sonraki Adımlar

Bu plan v1 MVP'nin **temelini** üretir: giriş + izin listesi + temalı kabuk + tasarım sistemi. Sonraki planlar (her biri ayrı dosya):

1. **Müfredat + Ders + İlerleme** — tracks/modules/lessons şeması, müfredat ağacı (sidebar), ders sayfası (YouTube embed + notlar + "İzledim"), `lesson_progress`.
2. **Quiz** — quizzes/questions/quiz_attempts şeması, çoktan seçmeli quiz akışı, otomatik puanlama.
3. **Dashboard verisi** — gerçek ilerleme/istatistik/dal kartları (mockup'taki `dashboard.html`).
4. **Admin paneli** — içerik CRUD (dal/modül/ders/quiz) + üye/rol yönetimi.

(v2: pratik görev gönderme+onay, rozetler, liderlik tablosu, profil aktivite akışı — ayrıca planlanacak.)
