import type { RequestSourceContext } from "@/hooks/useRequests";

export type RequestSourceKind = RequestSourceContext["kind"];

/** Единые префиксы блока «Источник» в первом сообщении чата */
export const REQUEST_SOURCE_PREFIX: Record<RequestSourceKind, string> = {
  catalog: "Каталог",
  service: "Услуги",
  material: "Материалы",
  tender: "Тендер",
  promo: "Витрина",
};

export function buildRequestSource(input: {
  kind: RequestSourceKind;
  detail: string;
  url?: string;
}): RequestSourceContext {
  const detail = input.detail.trim();
  return {
    kind: input.kind,
    label: detail ? `${REQUEST_SOURCE_PREFIX[input.kind]}: ${detail}` : REQUEST_SOURCE_PREFIX[input.kind],
    url: input.url?.trim() || undefined,
  };
}

/** Подпись для UI (без дублирования префикса, если label уже полный) */
export function formatSourceKindLabel(kind: RequestSourceKind): string {
  return REQUEST_SOURCE_PREFIX[kind];
}
