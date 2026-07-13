// Migration uygulayıcı: supabase/migrations/*.sql dosyalarını sırayla, bir kez uygular.
// Uygulananları public.schema_migrations tablosunda tutar (yeniden çalıştırmak güvenli).
//
//   node scripts/migrate.mjs            → bekleyenleri uygular
//   node scripts/migrate.mjs --status   → sadece durumu yazar
//
// DATABASE_URL, web/.env.local içinden okunur (Supabase → Settings → Database → Session pooler).
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const web = dirname(dirname(fileURLToPath(import.meta.url)));
const MIG_DIR = join(web, "..", "supabase", "migrations");

function envFromFile() {
  const out = {};
  let raw = "";
  try {
    raw = readFileSync(join(web, ".env.local"), "utf8");
  } catch {
    return out;
  }
  for (const line of raw.split("\n")) {
    const m = /^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const url = process.env.DATABASE_URL ?? envFromFile().DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL yok. web/.env.local içine ekle (Supabase → Settings → Database → Session pooler URI).");
  process.exit(1);
}

// Supabase şifreleri #, ? gibi URL'de anlamlı karakterler içerebilir. Ham dizeyi
// connectionString olarak vermek bunları fragment/query sanıp bağlantıyı bozar,
// o yüzden alanlarına ayırıp tek tek geçiyoruz.
function parcala(dsn) {
  const m = /^postgres(?:ql)?:\/\/([^:]+):(.*)@([^/@]+?)(?::(\d+))?\/([^?]+)/.exec(dsn);
  if (!m) throw new Error("DATABASE_URL biçimi tanınmadı (postgresql://kullanıcı:şifre@host:port/db bekleniyor)");
  const [, user, password, host, port, database] = m;
  return { user, password, host, port: Number(port ?? 5432), database };
}

const client = new pg.Client({ ...parcala(url), ssl: { rejectUnauthorized: false } });
await client.connect();

await client.query(`
  create table if not exists public.schema_migrations (
    version text primary key,
    applied_at timestamptz not null default now()
  )
`);

const { rows } = await client.query("select version from public.schema_migrations");
const applied = new Set(rows.map((r) => r.version));
const files = readdirSync(MIG_DIR).filter((f) => f.endsWith(".sql")).sort();
const pending = files.filter((f) => !applied.has(f));

// --baseline 0029  → 0029 ve öncesini ÇALIŞTIRMADAN "uygulanmış" işaretler.
// (Bu projede 0001–0029 SQL editor'den elle uygulanmıştı; tekrar çalıştırmak hata verirdi.)
const bIdx = process.argv.indexOf("--baseline");
if (bIdx !== -1) {
  const upto = process.argv[bIdx + 1]; // ör. "0029" → dosya adı bu önekle başlayan ve öncesi
  const secilen = files.filter((f) => f.slice(0, 4) <= upto && !applied.has(f));
  for (const f of secilen) {
    await client.query("insert into public.schema_migrations(version) values ($1) on conflict do nothing", [f]);
    console.log("baseline:", f);
  }
  await client.end();
  process.exit(0);
}

if (process.argv.includes("--status")) {
  console.log(`uygulanmış: ${applied.size} · bekleyen: ${pending.length}`);
  for (const f of pending) console.log("  bekliyor:", f);
  await client.end();
  process.exit(0);
}

if (pending.length === 0) console.log("Bekleyen migration yok.");

for (const f of pending) {
  const sql = readFileSync(join(MIG_DIR, f), "utf8");
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into public.schema_migrations(version) values ($1)", [f]);
    await client.query("commit");
    console.log("✓", f);
  } catch (e) {
    await client.query("rollback");
    // Eski migration'lar SQL editor'den elle uygulanmış olabilir → "already exists" beklenen durum.
    console.error("✗", f, "→", e.message);
    if (!process.argv.includes("--continue-on-error")) {
      await client.end();
      process.exit(1);
    }
  }
}

await client.end();
