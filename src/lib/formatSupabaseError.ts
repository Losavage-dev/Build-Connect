import i18n from "@/i18n";

/** Человекочитаемое сообщение из ошибки Supabase/PostgREST */
export function formatSupabaseError(error: unknown, fallback?: string): string {
  const fb = fallback ?? i18n.t("common:dbError");
  if (!error || typeof error !== "object") return fb;
  const e = error as { message?: string; code?: string; details?: string; hint?: string };
  const msg = e.message?.trim();
  if (!msg) return fb;

  if (
    e.code === "PGRST204" ||
    /source_tender_id/i.test(msg) ||
    (/recipient_profile_id/i.test(msg) && /column/i.test(msg))
  ) {
    return i18n.t("common:dbError");
  }
  if (e.code === "42501" || /row-level security/i.test(msg)) {
    return i18n.t("common:dbErrorPermission");
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
