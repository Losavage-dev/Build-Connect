const INTENT_KEY = "bc_onboarding_intent";
const DONE_KEY = "bc_onboarding_intent_done";

export type OnboardingIntent = "create_company" | "buy_only";

export function getOnboardingIntent(): OnboardingIntent | null {
  const v = localStorage.getItem(INTENT_KEY);
  if (v === "create_company" || v === "buy_only") return v;
  return null;
}

export function setOnboardingIntent(intent: OnboardingIntent): void {
  localStorage.setItem(INTENT_KEY, intent);
  localStorage.setItem(DONE_KEY, "1");
}

export function hasCompletedOnboardingIntent(): boolean {
  return localStorage.getItem(DONE_KEY) === "1";
}

export function clearOnboardingIntent(): void {
  localStorage.removeItem(INTENT_KEY);
  localStorage.removeItem(DONE_KEY);
}
