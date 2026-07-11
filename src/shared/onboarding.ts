export const ONBOARDING_COMPLETED_STORAGE_KEY = "turtle-neck-buddy-onboarding-completed";

export function getOnboardingCompleted(value: unknown) {
  return value === true;
}
