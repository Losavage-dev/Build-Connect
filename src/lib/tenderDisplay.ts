import { differenceInCalendarDays, format, isValid, parseISO, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";

export function parseTenderDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = value.length <= 10 ? parseISO(`${value}T12:00:00`) : parseISO(value);
  return isValid(d) ? d : null;
}

/** Calendar days from today (inclusive start) until tender deadline; null if no deadline. */
export function getTenderDeadlineMaxDays(
  deadline: string | null | undefined,
  now: Date = new Date(),
): number | null {
  const deadlineDate = parseTenderDate(deadline);
  if (!deadlineDate) return null;
  return Math.max(0, differenceInCalendarDays(startOfDay(deadlineDate), startOfDay(now)));
}

export function formatTenderDate(value: string | null | undefined): string | null {
  const d = parseTenderDate(value);
  if (!d) return null;
  return format(d, "d MMM yyyy", { locale: ru });
}

export function formatTenderDateShort(value: string | null | undefined): string | null {
  const d = parseTenderDate(value);
  if (!d) return null;
  return format(d, "d MMM", { locale: ru });
}
