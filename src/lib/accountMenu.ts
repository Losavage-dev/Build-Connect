import type { LucideIcon } from "lucide-react";
import { Building2, FileText, HelpCircle, MessageSquare, Plus, Settings, Shield } from "lucide-react";

export type AccountMenuLink = {
  to: string;
  labelKey: string;
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
        labelKey: "account.moderator",
        icon: Shield,
      },
    ];
  }

  const links: AccountMenuLink[] = [
    {
      to: "/profile?tab=requests",
      labelKey: "account.requests",
      icon: MessageSquare,
      badge: input.unreadMessages > 0 ? input.unreadMessages : undefined,
    },
    {
      to: "/profile?tab=tenders",
      labelKey: "account.myTenders",
      icon: FileText,
    },
  ];

  if (input.companyCount === 0) {
    links.push({
      to: "/create-company",
      labelKey: "account.createCompany",
      icon: Plus,
    });
  } else if (input.companyCount === 1 && input.firstCompanyId) {
    links.push({
      to: `/company/${input.firstCompanyId}/manage`,
      labelKey: "account.myCompany",
      icon: Building2,
    });
  } else {
    links.push({
      to: "/profile?tab=companies",
      labelKey: "account.myCompanies",
      icon: Building2,
    });
  }

  return links;
}

/** Настройки и помощь — нижний блок перед «Выйти». */
export function buildAccountMenuSecondaryLinks(): AccountMenuLink[] {
  return [
    { to: "/profile?tab=settings", labelKey: "account.settings", icon: Settings },
    { to: "/help", labelKey: "account.help", icon: HelpCircle },
  ];
}
