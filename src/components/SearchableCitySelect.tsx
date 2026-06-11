import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCatalogLabel } from "@/lib/i18nCatalog";
import { useAppFormat } from "@/hooks/useAppFormat";

type Props = {
  cities: readonly string[];
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  id?: string;
};

export function SearchableCitySelect({ cities, value, onChange, placeholder, id }: Props) {
  const { t } = useTranslation("common");
  const catalogLabel = useCatalogLabel();
  const { compareStrings } = useAppFormat();
  const resolvedPlaceholder = placeholder ?? t("selectCity");
  const [open, setOpen] = useState(false);
  const sorted = useMemo(() => [...cities].sort((a, b) => compareStrings(a, b)), [cities, compareStrings]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between rounded-xl font-normal"
        >
          {value ? catalogLabel(value) : resolvedPlaceholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={t("citySelect.searchPlaceholder")} className="h-10" />
          <CommandList>
            <CommandEmpty>{t("notFound")}</CommandEmpty>
            <CommandGroup>
              {sorted.map((city) => (
                <CommandItem
                  key={city}
                  value={city}
                  keywords={[catalogLabel(city)]}
                  onSelect={() => {
                    onChange(city);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === city ? "opacity-100" : "opacity-0")} />
                  {catalogLabel(city)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
