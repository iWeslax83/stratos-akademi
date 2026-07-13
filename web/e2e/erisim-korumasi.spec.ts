import { test, expect } from "@playwright/test";

// Oturumsuz ziyaretçi hiçbir admin sayfasını göremez; girişe atılır.
const ADMIN_YOLLARI = [
  "/admin/oneriler",
  "/admin/uyeler",
  "/admin/mufredat",
  "/admin/onaylar",
  "/admin/analitik",
];

for (const yol of ADMIN_YOLLARI) {
  test(`oturumsuz ${yol} → /login`, async ({ page }) => {
    await page.goto(yol);
    await expect(page).toHaveURL(/\/login/);
  });
}

test("giriş sayfası açılır", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /google ile giriş/i })).toBeVisible();
});

test("cron uç noktası Bearer olmadan 401 döner", async ({ request }) => {
  const res = await request.post("/api/cron/video-tara");
  expect(res.status()).toBe(401);
});

test("CSV raporu oturumsuz indirilemez", async ({ page }) => {
  // Rapor herkesin ilerlemesini içerir: oturumsuz istek girişe atılmalı, CSV dönmemeli.
  const res = await page.goto("/api/admin/rapor?tip=uyeler");
  expect(res?.headers()["content-type"]).not.toContain("text/csv");
  await expect(page).toHaveURL(/\/login/);
});
