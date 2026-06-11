import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ru, enUS } from "date-fns/locale";
import type { Locale } from "date-fns";

export function useAppLocale(): string {
  const { i18n } = useTranslation();
  return i18n.language === "en" ? "en-US" : "ru-RU";
}

export function useDateFnsLocale(): Locale {
  const { i18n } = useTranslation();
  return i18n.language === "en" ? enUS : ru;
}

export function useAppFormat() {
  const locale = useAppLocale();

  return useMemo(
    () => ({
      locale,
      formatCurrency: (amount: number, currency = "KZT") =>
        new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(amount),
      formatNumber: (value: number) => new Intl.NumberFormat(locale).format(value),
      formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat(locale, options).format(new Date(date)),
      compareStrings: (a: string, b: string) => a.localeCompare(b, locale),
    }),
    [locale],
  );
}
