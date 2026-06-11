import type { Request } from "@/hooks/useRequests";
import {
  META_LINE_LINK,
  META_LINE_SOURCE,
  companyNameFromMeta,
  splitRequestOpeningMessage,
} from "@/lib/requestChatMessage";

export type DealContext = {
  sourceLabel: string;
  sourceUrl: string | null;
  actingCompanyName: string | null;
};

export type DealStatusStep = {
  id: string;
  label: string;
  state: "done" | "current" | "upcoming" | "rejected";
};

export function parseDealContextFromMessage(content: string | undefined | null): Omit<DealContext, "sourceLabel"> & {
  sourceLabel: string | null;
} {
  if (!content?.trim()) {
    return { sourceLabel: null, sourceUrl: null, actingCompanyName: null };
  }

  const { meta } = splitRequestOpeningMessage(content);
  if (!meta) {
    return { sourceLabel: null, sourceUrl: null, actingCompanyName: null };
  }

  let sourceLabel: string | null = null;
  let sourceUrl: string | null = null;

  for (const line of meta.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith(META_LINE_SOURCE)) {
      sourceLabel = trimmed.slice(META_LINE_SOURCE.length).trim() || null;
    }
    if (trimmed.startsWith(META_LINE_LINK)) {
      sourceUrl = trimmed.slice(META_LINE_LINK.length).trim() || null;
    }
  }

  return {
    sourceLabel,
    sourceUrl,
    actingCompanyName: companyNameFromMeta(meta),
  };
}

type RequestWithRelations = Request & {
  company?: { id?: string; name: string; logo_url?: string | null } | null;
  source_tender?: { id: string; title: string } | null;
};

export function resolveDealContext(
  request: RequestWithRelations,
  openingMessageContent: string | undefined | null,
): DealContext {
  const parsed = parseDealContextFromMessage(openingMessageContent);

  if (parsed.sourceLabel) {
    return {
      sourceLabel: parsed.sourceLabel,
      sourceUrl: parsed.sourceUrl,
      actingCompanyName: parsed.actingCompanyName,
    };
  }

  if (request.source_tender_id && request.source_tender?.title) {
    return {
      sourceLabel: `Тендер: ${request.source_tender.title}`,
      sourceUrl: `/tenders`,
      actingCompanyName: parsed.actingCompanyName,
    };
  }

  if (request.recipient_profile_id) {
    return {
      sourceLabel: "Тендер · отклик на профиль заказчика",
      sourceUrl: "/tenders",
      actingCompanyName: parsed.actingCompanyName,
    };
  }

  if (request.company_id && request.company?.name) {
    return {
      sourceLabel: `Каталог · ${request.company.name}`,
      sourceUrl: request.company.id ? `/company/${request.company.id}` : null,
      actingCompanyName: parsed.actingCompanyName,
    };
  }

  return {
    sourceLabel: "BuildConnect",
    sourceUrl: null,
    actingCompanyName: parsed.actingCompanyName,
  };
}

export function buildDealStatusSteps(status: Request["status"]): DealStatusStep[] {
  if (status === "rejected") {
    return [
      { id: "created", label: "Создана", state: "done" },
      { id: "rejected", label: "Отклонена", state: "rejected" },
    ];
  }

  const steps: DealStatusStep[] = [
    { id: "created", label: "Создана", state: "done" },
    { id: "pending", label: "На рассмотрении", state: "upcoming" },
    { id: "accepted", label: "Принята", state: "upcoming" },
    { id: "completed", label: "Завершена", state: "upcoming" },
  ];

  if (status === "pending") {
    steps[1].state = "current";
    return steps;
  }

  steps[1].state = "done";

  if (status === "accepted") {
    steps[2].state = "current";
    return steps;
  }

  steps[2].state = "done";
  steps[3].state = "current";
  return steps;
}

export function formatDealDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const REQUEST_STATUS_LABELS: Record<Request["status"], string> = {
  pending: "На рассмотрении",
  accepted: "Принята",
  rejected: "Отклонена",
  completed: "Завершена",
};
