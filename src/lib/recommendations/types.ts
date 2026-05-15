import type { UserRole } from "@/lib/userRoles";

export type UserEventType =
  | "view_company"
  | "view_tender"
  | "contact_company"
  | "bid_tender"
  | "like_promo"
  | "view_promo";

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
};

export type SortMode = "rating" | "for_you";
