/** Подпись категорий для карточек каталога: короткий бейдж на обложке + полная строка под описанием */
export function companyCardCategoryProps(company: {
  category: string;
  company_categories?: { category: string }[] | null;
}): { overlayLabel: string; categoriesLine: string } {
  const raw =
    company.company_categories?.map((c) => c.category).filter((c) => c && String(c).trim()) ?? [];
  const unique = raw.length > 0 ? [...new Set(raw)] : company.category ? [company.category] : [];
  const categoriesLine = unique.join(" · ") || company.category || "";
  const overlayLabel =
    unique.length > 1
      ? `${unique[0]} +${unique.length - 1}`
      : unique[0]
        ? unique[0].length > 28
          ? `${unique[0].slice(0, 26)}…`
          : unique[0]
        : categoriesLine.slice(0, 28) || "Компания";
  return { overlayLabel, categoriesLine };
}

export function companyCategoryLabel(company: {
  category: string;
  company_categories?: { category: string }[] | null;
}): string {
  const list =
    company.company_categories?.map((r) => r.category).filter((c) => c && c.trim()) ?? [];
  if (list.length > 0) return [...new Set(list)].join(" · ");
  return company.category || "";
}
