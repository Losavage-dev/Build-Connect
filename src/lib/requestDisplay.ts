import type { Request } from "@/hooks/useRequests";

type NameFields = {
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
} | null;

export function formatPersonName(person: NameFields, fallback = "Пользователь"): string {
  if (!person) return fallback;
  const name = `${person.first_name || ""} ${person.last_name || ""}`.trim();
  return name || fallback;
}

export function isRequestIncoming(
  request: Pick<Request, "client_id">,
  profileId: string | undefined,
): boolean {
  if (!profileId) return false;
  return request.client_id !== profileId;
}

export type RequestDisplayInfo = {
  direction: "incoming" | "outgoing";
  title: string;
  subtitle: string | null;
  avatarUrl: string | null;
  avatarFallback: string;
};

export function getRequestDisplay(request: Request, profileId: string): RequestDisplayInfo {
  const incoming = isRequestIncoming(request, profileId);
  const clientName = formatPersonName(request.client, "Заказчик");
  const recipientName = formatPersonName(request.recipient, "Получатель");
  const companyName = request.company?.name?.trim();

  if (incoming) {
    if (request.recipient_profile_id) {
      return {
        direction: "incoming",
        title: clientName,
        subtitle: "Отклик на ваш тендер · лично в профиль",
        avatarUrl: request.client?.avatar_url ?? null,
        avatarFallback: clientName.charAt(0) || "З",
      };
    }
    return {
      direction: "incoming",
      title: clientName,
      subtitle: companyName ? `Заявка в «${companyName}»` : "Входящая заявка в компанию",
      avatarUrl: request.client?.avatar_url ?? null,
      avatarFallback: clientName.charAt(0) || "З",
    };
  }

  if (request.recipient_profile_id) {
    return {
      direction: "outgoing",
      title: recipientName,
      subtitle: "Лично пользователю · отклик на тендер без компании у автора",
      avatarUrl: request.recipient?.avatar_url ?? null,
      avatarFallback: recipientName.charAt(0) || "П",
    };
  }

  return {
    direction: "outgoing",
    title: companyName || "Компания",
    subtitle: "Заявка в компанию из каталога или витрины",
    avatarUrl: request.company?.logo_url ?? null,
    avatarFallback: (companyName || "К").charAt(0),
  };
}
