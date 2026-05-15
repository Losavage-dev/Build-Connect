/** Человекочитаемое сообщение из ошибки Supabase/PostgREST */
export function formatSupabaseError(error: unknown, fallback = "Ошибка базы данных"): string {
  if (!error || typeof error !== "object") return fallback;
  const e = error as { message?: string; code?: string; details?: string; hint?: string };
  const msg = e.message?.trim();
  if (!msg) return fallback;

  if (e.code === "PGRST204" || /source_tender_id/i.test(msg)) {
    return "Не применена миграция БД (source_tender_id). Выполните 20260521120000_request_source_tender.sql в Supabase.";
  }
  if (/recipient_profile_id/i.test(msg) && /column/i.test(msg)) {
    return "Не применена миграция БД (recipient_profile_id). Выполните 20260520150000_tender_type_and_request_recipient.sql в Supabase.";
  }
  if (e.code === "42501" || /row-level security/i.test(msg)) {
    return "Нет прав на это действие. Проверьте вход и политики RLS в Supabase.";
  }

  return msg.length > 200 ? `${msg.slice(0, 200)}…` : msg;
}

export function isMissingColumnError(error: unknown, column: string): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { message?: string; code?: string };
  const msg = (e.message || "").toLowerCase();
  const col = column.toLowerCase();
  return e.code === "PGRST204" || (msg.includes(col) && (msg.includes("column") || msg.includes("schema")));
}
