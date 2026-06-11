import type { UserRole } from "@/lib/userRoles";

export type UserEventType =
  | "view_company"
  | "view_tender"
  | "contact_company"
  | "bid_tender"
  | "like_promo"
  | "view_promo"
  | "view_material"
  | "order_material";

export type EntityType = "company" | "tender" | "promo_post" | "service" | "material";

export type UserEventRow = {
  event_type: UserEventType;
  entity_type: EntityType;
  entity_id: string;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
};

export type RecommendationContext = {
  profileId: string | null;
  role: UserRole | null;
  city: string | null;
  /** Категории из просмотров компаний / лайков роликов */
  interestCategories: string[];
  viewedCompanyIds: Set<string>;
  viewedTenderIds: Set<string>;
  contactedCompanyIds: Set<string>;
  myCompanyIds: Set<string>;
  trendingCompanyScores: Map<string, number>;
  /** Тендеры, на которые пользователь уже откликался */
  bidTenderIds: Set<string>;
  /** Типы тендеров из просмотров (view_tender metadata) */
  preferredTenderTypes: Set<string>;
  viewedMaterialIds: Set<string>;
  orderedMaterialIds: Set<string>;
  /** Категории материалов из просмотров */
  preferredMaterialGroups: Set<string>;
  /** Категории материалов по активности (просмотры и заказы) */
  interestMaterialGroups: string[];
};

export type SortMode = "rating" | "for_you";
