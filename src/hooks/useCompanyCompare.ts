import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  COMPANY_COMPARE_STORAGE_KEY,
  loadCompanyCompare,
  MAX_COMPANY_COMPARE,
  saveCompanyCompare,
  type CompanyCompareEntry,
} from "@/lib/companyCompare";

const COMPARE_EVENT = "buildconnect:company-compare-changed";

function emitCompareChange() {
  window.dispatchEvent(new Event(COMPARE_EVENT));
}

export function useCompanyCompare() {
  const [entries, setEntries] = useState<CompanyCompareEntry[]>(() => loadCompanyCompare());

  const syncFromStorage = useCallback(() => {
    setEntries(loadCompanyCompare());
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === COMPANY_COMPARE_STORAGE_KEY) {
        syncFromStorage();
      }
    };
    window.addEventListener(COMPARE_EVENT, syncFromStorage);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(COMPARE_EVENT, syncFromStorage);
      window.removeEventListener("storage", onStorage);
    };
  }, [syncFromStorage]);

  const persist = useCallback((next: CompanyCompareEntry[]) => {
    saveCompanyCompare(next);
    setEntries(next);
    emitCompareChange();
  }, []);

  const isSelected = useCallback((id: string) => entries.some((e) => e.id === id), [entries]);

  const toggle = useCallback(
    (entry: CompanyCompareEntry) => {
      if (isSelected(entry.id)) {
        persist(entries.filter((e) => e.id !== entry.id));
        return;
      }
      if (entries.length >= MAX_COMPANY_COMPARE) {
        toast.message(`Можно сравнить не более ${MAX_COMPANY_COMPARE} компаний`, {
          description: "Снимите одну из выбранных, чтобы добавить другую.",
        });
        return;
      }
      persist([...entries, entry]);
    },
    [entries, isSelected, persist],
  );

  const remove = useCallback(
    (id: string) => {
      persist(entries.filter((e) => e.id !== id));
    },
    [entries, persist],
  );

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

  return {
    entries,
    ids: entries.map((e) => e.id),
    count: entries.length,
    isSelected,
    toggle,
    remove,
    clear,
    canCompare: entries.length >= 2,
    isFull: entries.length >= MAX_COMPANY_COMPARE,
  };
}
