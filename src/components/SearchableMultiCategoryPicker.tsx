import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useCatalogLabel } from "@/lib/i18nCatalog";
import { useAppFormat } from "@/hooks/useAppFormat";

type Props = {
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  description?: string;
};

export function SearchableMultiCategoryPicker({
  options,
  value,
  onChange,
  label,
  description,
}: Props) {
  const { t } = useTranslation("common");
  const catalogLabel = useCatalogLabel();
  const { compareStrings } = useAppFormat();
  const resolvedLabel = label ?? t("categoryPicker.label");
  const resolvedDescription = description ?? t("categoryPicker.description");
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const sorted = [...options].sort((a, b) => compareStrings(a, b));
    if (!needle) return sorted;
    return sorted.filter((o) => catalogLabel(o).toLowerCase().includes(needle) || o.toLowerCase().includes(needle));
  }, [options, q, compareStrings, catalogLabel]);

  const toggle = (cat: string) => {
    if (value.includes(cat)) {
      onChange(value.filter((c) => c !== cat));
    } else {
      onChange([...value, cat]);
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <Label>{resolvedLabel} *</Label>
        {resolvedDescription ? <p className="text-xs text-muted-foreground mt-1">{resolvedDescription}</p> : null}
      </div>
      <Input
        placeholder={t("categoryPicker.searchPlaceholder")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="rounded-xl bg-muted/30"
      />
      {value.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {t("categoryPicker.selected")}{" "}
          <span className="font-medium text-foreground">{value.map(catalogLabel).join(" · ")}</span>
        </p>
      ) : null}
      <ScrollArea className="h-[min(280px,40vh)] rounded-xl border bg-card">
        <div className="p-2 space-y-0.5">
          {filtered.map((cat) => {
            const selected = value.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggle(cat)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  selected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/80",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                  )}
                >
                  {selected ? <Check className="h-3 w-3" /> : null}
                </span>
                <span className="flex-1 leading-snug">{catalogLabel(cat)}</span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
