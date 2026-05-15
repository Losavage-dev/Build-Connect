/**
 * Маршруты, доступные без входа (просмотр витрины).
 * Действия (заявка, заказ, отклик, чат) — только после авторизации.
 */
const PUBLIC_EXACT = new Set([
  "/",
  "/auth",
  "/catalog",
  "/feed",
  "/help",
  "/contacts",
  "/about",
  "/terms",
  "/services",
  "/materials",
  "/tenders",
]);

/** Публичная карточка компании; /company/:id/manage — только для владельца (ProtectedRoute). */
export function isPublicBrowsingPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  if (pathname.startsWith("/company/") && !pathname.endsWith("/manage")) return true;
  return false;
}

/** Доступ без заполненного профиля (онбординг не блокирует просмотр). */
export function isAllowedWithIncompleteProfile(pathname: string): boolean {
  return pathname === "/auth" || pathname === "/complete-profile" || isPublicBrowsingPath(pathname);
}
