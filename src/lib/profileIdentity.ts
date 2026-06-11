/** Фиксация ФИО профиля и окно одной правки опечатки. */

export const IDENTITY_CORRECTION_WINDOW_MS = 24 * 60 * 60 * 1000;

export type ProfileIdentityFields = {
  first_name: string | null;
  last_name: string | null;
  phone?: string | null;
  city?: string | null;
  created_at?: string;
  identity_locked_at?: string | null;
  name_correction_used_at?: string | null;
  role?: string;
};

export function isIdentityLocked(profile: ProfileIdentityFields | null | undefined): boolean {
  if (!profile?.identity_locked_at) return false;
  if (profile.role === "moderator" || profile.role === "admin") return false;
  return true;
}

/** Одно исправление ФИО в первые 24 часа после регистрации. */
export function canCorrectIdentityName(
  profile: ProfileIdentityFields | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!profile || !isIdentityLocked(profile)) return false;
  if (profile.name_correction_used_at) return false;
  if (!profile.created_at) return false;
  const created = new Date(profile.created_at).getTime();
  if (Number.isNaN(created)) return false;
  return now.getTime() - created < IDENTITY_CORRECTION_WINDOW_MS;
}

export function isIdentityNameEditable(
  profile: ProfileIdentityFields | null | undefined,
  now?: Date,
): boolean {
  if (!profile) return false;
  if (profile.role === "moderator" || profile.role === "admin") return true;
  if (!isIdentityLocked(profile)) return true;
  return canCorrectIdentityName(profile, now);
}

/** Телефон можно задать до фиксации профиля; после — только через поддержку. */
export function isIdentityPhoneEditable(profile: ProfileIdentityFields | null | undefined): boolean {
  if (!profile) return false;
  if (profile.role === "moderator" || profile.role === "admin") return true;
  return !isIdentityLocked(profile);
}

export function identityCorrectionExpiresAt(profile: ProfileIdentityFields | null | undefined): Date | null {
  if (!profile?.created_at) return null;
  const created = new Date(profile.created_at);
  if (Number.isNaN(created.getTime())) return null;
  return new Date(created.getTime() + IDENTITY_CORRECTION_WINDOW_MS);
}

export function normalizePersonName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
