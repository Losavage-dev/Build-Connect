import { supabase } from "@/integrations/supabase/client";

/** Убираем символы, ломающие PostgREST ilike / or-фильтры */
export function sanitizeSearchFragment(raw: string): string {
  return raw
    .trim()
    .replace(/[%_,(),]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function scoreTitleMatch(query: string, title: string | null | undefined): number {
  const q = norm(query);
  const t = norm(title || "");
  if (!q || !t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 58;
  if (t.includes(q)) return 38;
  return 0;
}

function scoreDescriptionMatch(query: string, desc: string | null | undefined): number {
  const q = norm(query);
  const t = norm(desc || "");
  if (!q || !t || !t.includes(q)) return 0;
  return 12;
}

function bestCompanyScore(query: string, names: (string | undefined)[]): number {
  let m = 0;
  for (const n of names) {
    m = Math.max(m, scoreTitleMatch(query, n));
  }
  return m;
}

function bestServiceScore(
  query: string,
  rows: { title?: string | null; description?: string | null }[],
): number {
  let m = 0;
  for (const r of rows) {
    const a = Math.max(scoreTitleMatch(query, r.title), scoreDescriptionMatch(query, r.description));
    m = Math.max(m, a);
  }
  return m;
}

function bestTenderScore(
  query: string,
  rows: { title?: string | null; description?: string | null; city?: string | null }[],
): number {
  let m = 0;
  for (const r of rows) {
    const a = Math.max(
      scoreTitleMatch(query, r.title),
      scoreDescriptionMatch(query, r.description),
      scoreTitleMatch(query, r.city),
    );
    m = Math.max(m, a);
  }
  return m;
}

type Winner = "catalog" | "services" | "materials" | "tenders";

function pickWinner(scores: Record<Winner, number>): Winner {
  const maxRaw = Math.max(scores.catalog, scores.services, scores.materials, scores.tenders);
  if (maxRaw <= 0) return "catalog";
  const winners = (Object.keys(scores) as Winner[]).filter((w) => scores[w] === maxRaw);
  if (winners.length === 1) return winners[0];
  if (winners.includes("catalog") && maxRaw >= 100) return "catalog";
  const order: Winner[] = ["tenders", "materials", "services", "catalog"];
  return order.find((w) => winners.includes(w)) || "catalog";
}

/**
 * По введённой строке выбираем раздел с наиболее релевантными совпадениями
 * (название услуги/товара/тендера не уходит в каталог компаний при сильном совпадении по витрине).
 */
export async function resolveUniversalSearchPath(raw: string): Promise<string> {
  const inner = sanitizeSearchFragment(raw);
  if (!inner) return "/catalog";

  const pattern = `%${inner}%`;
  const enc = encodeURIComponent(raw.trim());

  const orTitleDesc = `title.ilike.${pattern},description.ilike.${pattern}`;

  const [companiesRes, servicesRes, materialsRes, tendersRes] = await Promise.all([
    supabase.from("companies").select("name").ilike("name", pattern).limit(20),
    supabase
      .from("services")
      .select("title,description")
      .neq("category", "Материалы")
      .or(orTitleDesc)
      .limit(20),
    supabase.from("services").select("title,description").eq("category", "Материалы").or(orTitleDesc).limit(20),
    supabase
      .from("tenders")
      .select("title,description,city")
      .or(`title.ilike.${pattern},description.ilike.${pattern},city.ilike.${pattern}`)
      .limit(20),
  ]);

  const companyNames = (companiesRes.data || []).map((r: { name?: string }) => r.name);
  const svcRows = servicesRes.data || [];
  const matRows = materialsRes.data || [];
  const tenRows = tendersRes.data || [];

  const scores: Record<Winner, number> = {
    catalog: bestCompanyScore(raw.trim(), companyNames),
    services: bestServiceScore(raw.trim(), svcRows),
    materials: bestServiceScore(raw.trim(), matRows),
    tenders: bestTenderScore(raw.trim(), tenRows),
  };

  const best = pickWinner(scores);

  switch (best) {
    case "services":
      return `/services?search=${enc}`;
    case "materials":
      return `/materials?search=${enc}`;
    case "tenders":
      return `/tenders?search=${enc}`;
    default:
      return `/catalog?search=${enc}`;
  }
}
