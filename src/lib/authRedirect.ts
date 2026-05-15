/** Безопасный внутренний путь после входа (без open redirect). */
export function safeRedirectPath(raw: string | null | undefined, fallback = "/profile"): string {
  if (!raw) return fallback;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/auth")) {
    return fallback;
  }
  return path;
}

export function authPath(returnTo?: string): string {
  const safe = returnTo ? safeRedirectPath(returnTo, "") : "";
  if (!safe) return "/auth";
  return `/auth?redirect=${encodeURIComponent(safe)}`;
}
