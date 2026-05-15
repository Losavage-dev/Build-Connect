/** Профиль считается заполненным — доступ к сайту после онбординга */
export function isProfileComplete(profile: {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
} | null): boolean {
  if (!profile) return false;
  const fn = (profile.first_name ?? "").trim();
  const ln = (profile.last_name ?? "").trim();
  const ph = (profile.phone ?? "").trim();
  const city = (profile.city ?? "").trim();
  return Boolean(fn && ln && ph && city);
}
