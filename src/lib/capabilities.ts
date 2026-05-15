import type { User } from "@supabase/supabase-js";
import { isStaffRole } from "@/lib/userRoles";

export type ProfileLike = {
  id: string;
  role?: string;
} | null;

export type CapabilitiesInput = {
  user: User | null;
  profile: ProfileLike;
  myCompanyIds: string[];
};

export type TenderLike = {
  client_id: string;
  status: string;
};

function isAuthenticated(ctx: CapabilitiesInput): boolean {
  return !!ctx.user && !!ctx.profile;
}

function isStaff(ctx: CapabilitiesInput): boolean {
  return isStaffRole(ctx.profile?.role);
}

export function isOwnCompany(ctx: CapabilitiesInput, companyId: string): boolean {
  return ctx.myCompanyIds.includes(companyId);
}

export function isOwnProfile(ctx: CapabilitiesInput, profileId: string): boolean {
  return ctx.profile?.id === profileId;
}

/** Заявка в компанию из каталога / ролика */
export function canContactCompany(ctx: CapabilitiesInput, companyOwnerId: string): boolean {
  if (!isAuthenticated(ctx) || isStaff(ctx)) return false;
  if (isOwnProfile(ctx, companyOwnerId)) return false;
  return true;
}

/** Заказ услуги / покупка материала */
export function canBuyListing(ctx: CapabilitiesInput, listingCompanyId: string): boolean {
  if (!isAuthenticated(ctx) || isStaff(ctx)) return false;
  if (isOwnCompany(ctx, listingCompanyId)) return false;
  return true;
}

/** Публикация на витрине услуг / материалов */
export function canPublishListing(ctx: CapabilitiesInput): boolean {
  return isAuthenticated(ctx) && !isStaff(ctx) && ctx.myCompanyIds.length > 0;
}

/** Создание тендера — любая роль, кроме модератора */
export function canCreateTender(ctx: CapabilitiesInput): boolean {
  return isAuthenticated(ctx) && !isStaff(ctx);
}

/** Отклик на тендер */
export function canBidOnTender(ctx: CapabilitiesInput, tender: TenderLike): boolean {
  if (!isAuthenticated(ctx) || isStaff(ctx)) return false;
  if (tender.status !== "open") return false;
  if (isOwnProfile(ctx, tender.client_id)) return false;
  if (ctx.myCompanyIds.length === 0) return false;
  return true;
}

export function bidBlockReason(ctx: CapabilitiesInput, tender: TenderLike): string | null {
  if (isStaff(ctx)) return null;
  if (!ctx.user) return "Войдите, чтобы откликнуться";
  if (!ctx.profile) return null;
  if (tender.status !== "open") return "Отклик возможен только на открытые тендеры";
  if (isOwnProfile(ctx, tender.client_id)) return "Нельзя откликнуться на свой тендер";
  if (ctx.myCompanyIds.length === 0) return "Добавьте компанию в профиле, чтобы откликнуться";
  return null;
}

export function buildCapabilities(ctx: CapabilitiesInput) {
  return {
    isStaff: isStaff(ctx),
    isAuthenticated: isAuthenticated(ctx),
    myCompanyIds: ctx.myCompanyIds,
    isOwnCompany: (companyId: string) => isOwnCompany(ctx, companyId),
    isOwnProfile: (profileId: string) => isOwnProfile(ctx, profileId),
    canContactCompany: (companyOwnerId: string) => canContactCompany(ctx, companyOwnerId),
    canBuyListing: (listingCompanyId: string) => canBuyListing(ctx, listingCompanyId),
    canPublishListing: () => canPublishListing(ctx),
    canCreateTender: () => canCreateTender(ctx),
    canBidOnTender: (tender: TenderLike) => canBidOnTender(ctx, tender),
    bidBlockReason: (tender: TenderLike) => bidBlockReason(ctx, tender),
  };
}

export type Capabilities = ReturnType<typeof buildCapabilities>;
