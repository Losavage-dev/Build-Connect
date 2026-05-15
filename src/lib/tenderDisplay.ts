import { format, isValid, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export function formatTenderDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = value.length <= 10 ? parseISO(`${value}T12:00:00`) : parseISO(value);
  if (!isValid(d)) return null;
  return format(d, "d MMM yyyy", { locale: ru });
}

export function formatTenderDateShort(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = value.length <= 10 ? parseISO(`${value}T12:00:00`) : parseISO(value);
  if (!isValid(d)) return null;
  return format(d, "d MMM", { locale: ru });
}
