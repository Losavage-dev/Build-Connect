import type { LucideIcon } from "lucide-react";
import { Building2, FileText, HelpCircle, MessageSquare, Plus, Settings, Shield } from "lucide-react";

export type AccountMenuLink = {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

type BuildAccountMenuInput = {
  isStaff: boolean;
  companyCount: number;
  firstCompanyId?: string;
  unreadMessages: number;
};

/** Пункты основного блока меню аккаунта (navbar / mobile). */
export function buildAccountMenuMainLinks(input: BuildAccountMenuInput): AccountMenuLink[] {
  if (input.isStaff) {
    return [
      {
        to: "/profile?tab=reports",
        label: "Кабинет модератора",
        icon: Shield,
      },
    ];
  }

  const links: AccountMenuLink[] = [
    {
      to: "/profile?tab=requests",
      label: "Заявки и чаты",
      icon: MessageSquare,
      badge: input.unreadMessages > 0 ? input.unreadMessages : undefined,
    },
    {
      to: "/profile?tab=tenders",
      label: "Мои тендеры",
      icon: FileText,
    },
  ];

  if (input.companyCount === 0) {
    links.push({
      to: "/create-company",
      label: "Создать компанию",
      icon: Plus,
    });
  } else if (input.companyCount === 1 && input.firstCompanyId) {
    links.push({
      to: `/company/${input.firstCompanyId}/manage`,
      label: "Моя компания",
      icon: Building2,
    });
  } else {
    links.push({
      to: "/profile?tab=companies",
      label: "Мои компании",
      icon: Building2,
    });
  }

  return links;
}

/** Настройки и помощь — нижний блок перед «Выйти». */
export function buildAccountMenuSecondaryLinks(): AccountMenuLink[] {
  return [
    { to: "/profile?tab=settings", label: "Настройки", icon: Settings },
    { to: "/help", label: "Помощь", icon: HelpCircle },
  ];
}
