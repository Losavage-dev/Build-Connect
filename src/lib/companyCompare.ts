export const MAX_COMPANY_COMPARE = 3;
export const COMPANY_COMPARE_STORAGE_KEY = "buildconnect_company_compare";

export type CompanyCompareEntry = {
  id: string;
  name: string;
};

export function loadCompanyCompare(): CompanyCompareEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(COMPANY_COMPARE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is CompanyCompareEntry => {
        return (
          typeof item === "object" &&
          item !== null &&
          typeof (item as CompanyCompareEntry).id === "string" &&
          typeof (item as CompanyCompareEntry).name === "string"
        );
      })
      .slice(0, MAX_COMPANY_COMPARE);
  } catch {
    return [];
  }
}

export function saveCompanyCompare(entries: CompanyCompareEntry[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(COMPANY_COMPARE_STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_COMPANY_COMPARE)));
}

export function companyCompareIdsParam(entries: CompanyCompareEntry[]): string {
  return entries.map((e) => e.id).join(",");
}
