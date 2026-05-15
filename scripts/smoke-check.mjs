/**
 * Smoke-проверка перед деплоем: .env, REST API, ключевые таблицы.
 * Запуск: npm run smoke  (из папки buildconnectmarket)
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return {};
  const out = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function listMigrations() {
  const dir = join(root, "supabase", "migrations");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

async function restGet(url, key, table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body };
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL?.trim();
const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY)?.trim();

const migrations = listMigrations();
const tables = ["companies", "tenders", "requests", "reviews", "reports", "user_events"];

console.log("\n=== BuildConnect smoke check ===\n");

let failed = 0;

if (!url) {
  console.log("FAIL  VITE_SUPABASE_URL не задан в .env");
  failed++;
} else if (!url.includes("supabase.co")) {
  console.log("WARN  VITE_SUPABASE_URL не похож на Supabase Cloud");
} else {
  console.log("OK    VITE_SUPABASE_URL");
}

if (!key) {
  console.log("FAIL  VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_ANON_KEY не задан");
  failed++;
} else {
  console.log("OK    Supabase anon key");
}

console.log(`\nМиграций в репозитории: ${migrations.length}`);
if (migrations.length) {
  console.log(`      Последняя: ${migrations[migrations.length - 1]}`);
}

if (url && key) {
  console.log("\nПроверка таблиц через REST API:\n");
  for (const table of tables) {
    try {
      const r = await restGet(url, key, table);
      if (r.ok) {
        console.log(`OK    ${table}`);
      } else {
        const msg =
          typeof r.body === "object" && r.body?.message
            ? r.body.message
            : String(r.body).slice(0, 120);
        if (/does not exist|relation|PGRST205/i.test(msg)) {
          console.log(`FAIL  ${table} — таблица отсутствует (миграции не применены?)`);
          failed++;
        } else if (
          (table === "reports" || table === "user_events") &&
          r.status === 401 &&
          /permission denied/i.test(msg)
        ) {
          console.log(`OK    ${table} (таблица есть, anon не читает — RLS/GRANT, это нормально)`);
        } else {
          console.log(`FAIL  ${table} — HTTP ${r.status}: ${msg}`);
          failed++;
        }
      }
    } catch (e) {
      console.log(`FAIL  ${table} — ${e instanceof Error ? e.message : e}`);
      failed++;
    }
  }
}

console.log("\n--- Ручной smoke в браузере (5 мин) ---");
console.log("1. Гость: каталог, тендеры, услуги — без ошибок");
console.log("2. client@test.com / 123456 — заявка в каталог, тендер");
console.log("3. contractor1@test.com — отклик, чат, завершение → отзыв");
console.log("4. supplier-noco@test.com — тендер без компании, входящая заявка");
console.log("5. Профиль → смена роли (если нужно QA)\n");

if (failed > 0) {
  console.log(`Итог: ${failed} проверок не пройдено.\n`);
  process.exit(1);
}
console.log("Итог: автоматические проверки пройдены. Выполните ручной smoke в браузере.\n");
