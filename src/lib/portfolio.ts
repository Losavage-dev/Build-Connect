import { format, isValid, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export const PROJECT_PHASE_LABEL: Record<string, string> = {
  in_progress: "В процессе",
  completed: "Завершён",
};

export const IMAGE_ROLE_LABEL: Record<string, string> = {
  gallery: "Галерея",
  site_start: "Начало объекта",
  site_end: "Объект готов",
  work_in_progress: "Ход работ",
};

const IMAGE_ROLE_ORDER = ["site_start", "work_in_progress", "site_end", "gallery"];

export function sortProjectImages<
  T extends { image_role?: string | null; order_index?: number | null },
>(images: T[]): T[] {
  return [...images].sort((a, b) => {
    const ai = IMAGE_ROLE_ORDER.indexOf(a.image_role || "gallery");
    const bi = IMAGE_ROLE_ORDER.indexOf(b.image_role || "gallery");
    if (ai !== bi) return ai - bi;
    return (a.order_index ?? 0) - (b.order_index ?? 0);
  });
}

export function formatDisplayDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = value.length <= 10 ? parseISO(`${value}T12:00:00`) : parseISO(value);
  if (!isValid(d)) return null;
  return format(d, "d MMM yyyy", { locale: ru });
}

export function formatProjectPeriod(
  start: string | null | undefined,
  end: string | null | undefined,
): string | null {
  const s = formatDisplayDate(start);
  const e = formatDisplayDate(end);
  if (s && e) return `${s} — ${e}`;
  if (s) return `с ${s}`;
  if (e) return `завершён ${e}`;
  return null;
}
