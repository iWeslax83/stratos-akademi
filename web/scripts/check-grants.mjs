// service_role GRANT denetleyicisi.
//
// Bu projede SQL editor'den açılan tablolara service_role otomatik GRANT ALMIYOR. Grant yoksa
// sunucu işleri "permission denied" alır ve kod hatayı yuttuğu için SESSİZCE hiçbir şey yapmaz.
// (Video önerileri, admin analitiği ve üye silme bu yüzden aylarca bozuktu.)
//
// Bu betik, sunucu kodunun gerçekten ihtiyaç duyduğu izinleri DB'ye sorar ve eksik olanı bildirir.
//   node scripts/check-grants.mjs      → eksik varsa exit 1
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

// Sunucu tarafı (createServiceClient) akışlarının dokunduğu tablolar ve gereken izinler.
const GEREKEN = {
  tracks: ["SELECT"],
  modules: ["SELECT"],
  lessons: ["SELECT"],
  profiles: ["SELECT"],
  quizzes: ["SELECT"],
  questions: ["SELECT"],
  question_options: ["SELECT"],
  quiz_attempts: ["SELECT", "INSERT"],
  lesson_progress: ["SELECT"],
  task_submissions: ["SELECT"],
  allowlist: ["SELECT", "DELETE"],
  notifications: ["SELECT", "INSERT"],
  video_suggestions: ["SELECT", "INSERT", "UPDATE", "DELETE"],
  video_blacklist: ["SELECT", "INSERT", "DELETE"],
  video_scan_runs: ["SELECT", "INSERT"],
};

const web = dirname(dirname(fileURLToPath(import.meta.url)));
function envFromFile() {
  const out = {};
  for (const line of readFileSync(join(web, ".env.local"), "utf8").split("\n")) {
    const m = /^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
function parcala(dsn) {
  const m = /^postgres(?:ql)?:\/\/([^:]+):(.*)@([^/@]+?)(?::(\d+))?\/([^?]+)/.exec(dsn);
  if (!m) throw new Error("DATABASE_URL biçimi tanınmadı");
  const [, user, password, host, port, database] = m;
  return { user, password, host, port: Number(port ?? 5432), database };
}

const url = process.env.DATABASE_URL ?? envFromFile().DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL yok (web/.env.local).");
  process.exit(1);
}

const client = new pg.Client({ ...parcala(url), ssl: { rejectUnauthorized: false } });
await client.connect();

const { rows } = await client.query(`
  select table_name, privilege_type
  from information_schema.role_table_grants
  where grantee = 'service_role' and table_schema = 'public'
`);
await client.end();

const varOlan = new Map();
for (const r of rows) {
  if (!varOlan.has(r.table_name)) varOlan.set(r.table_name, new Set());
  varOlan.get(r.table_name).add(r.privilege_type);
}

const eksikler = [];
for (const [tablo, izinler] of Object.entries(GEREKEN)) {
  const mevcut = varOlan.get(tablo) ?? new Set();
  const eksik = izinler.filter((i) => !mevcut.has(i));
  if (eksik.length > 0) eksikler.push(`${tablo}: ${eksik.join(", ")}`);
}

if (eksikler.length === 0) {
  console.log(`✓ service_role grant'leri tam (${Object.keys(GEREKEN).length} tablo).`);
  process.exit(0);
}

console.error("✗ service_role'de EKSİK grant'ler — bu tablolara dokunan sunucu işleri sessizce ölür:");
for (const e of eksikler) console.error("   " + e);
console.error("\nDüzeltme: yeni bir migration'a `grant <izin> on public.<tablo> to service_role;` ekle.");
process.exit(1);
