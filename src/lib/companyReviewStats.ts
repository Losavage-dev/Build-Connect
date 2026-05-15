export type ReviewLike = { rating: number };

export type CompanyReviewStats = {
  count: number;
  averageRating: number | null;
  hasReviews: boolean;
};

/** Статистика из массива отзывов (карточка компании с join) */
export function statsFromReviews(reviews: ReviewLike[] | null | undefined): CompanyReviewStats {
  const list = reviews ?? [];
  const count = list.length;
  if (count === 0) {
    return { count: 0, averageRating: null, hasReviews: false };
  }
  const sum = list.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  return {
    count,
    averageRating: Math.round((sum / count) * 10) / 10,
    hasReviews: true,
  };
}

/** Статистика из полей companies (после триггера sync — совпадает с reviews) */
export function statsFromCompanyRow(company: {
  rating?: number | null;
  review_count?: number | null;
  reviews?: ReviewLike[] | null;
}): CompanyReviewStats {
  if (company.reviews && company.reviews.length > 0) {
    return statsFromReviews(company.reviews);
  }
  const count = Number(company.review_count ?? 0);
  if (count <= 0) {
    return { count: 0, averageRating: null, hasReviews: false };
  }
  const rating = Number(company.rating ?? 0);
  return {
    count,
    averageRating: rating > 0 ? rating : null,
    hasReviews: true,
  };
}

export function formatReviewCount(count: number): string {
  const n = Math.abs(count);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} отзывов`;
  if (mod10 === 1) return `${n} отзыв`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} отзыва`;
  return `${n} отзывов`;
}
