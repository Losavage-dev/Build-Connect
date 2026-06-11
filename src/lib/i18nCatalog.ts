import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { TenderTypeValue } from "@/lib/constants";

/** Перевод значения из БД (русский ключ) для отображения в UI. */
export function useCatalogLabel() {
  const { t } = useTranslation("catalogData");

  return useCallback(
    (value: string | null | undefined) => {
      if (!value?.trim()) return "";
      return t(value, { defaultValue: value });
    },
    [t],
  );
}

export function useTenderTypeLabel() {
  const { t } = useTranslation("catalogData");

  return useCallback(
    (value: TenderTypeValue | string | null | undefined) => {
      if (!value) return "";
      return t(`tenderTypes.${value}`, { defaultValue: value });
    },
    [t],
  );
}

export function useUserRoleLabel() {
  const { t } = useTranslation("catalogData");

  return useCallback(
    (role: string | null | undefined) => {
      if (!role) return "";
      return t(`userRoles.${role}`, { defaultValue: role });
    },
    [t],
  );
}
