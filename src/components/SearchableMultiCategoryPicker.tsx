import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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
  label = "Категории деятельности",
  description = "Можно выбрать несколько. Используйте поиск — список длинный.",
}: Props) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const sorted = [...options].sort((a, b) => a.localeCompare(b, "ru"));
    if (!needle) return sorted;
    return sorted.filter((o) => o.toLowerCase().includes(needle));
  }, [options, q]);

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
        <Label>{label} *</Label>
        {description ? <p className="text-xs text-muted-foreground mt-1">{description}</p> : null}
      </div>
      <Input
        placeholder="Поиск категории…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="rounded-xl bg-muted/30"
      />
      {value.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Выбрано: <span className="font-medium text-foreground">{value.join(" · ")}</span>
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
                <span className="flex-1 leading-snug">{cat}</span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
