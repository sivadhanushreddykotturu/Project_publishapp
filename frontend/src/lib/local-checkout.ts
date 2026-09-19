/** Temporary environment-controlled checkout bypass; never records a payment. */
export function canSkipOnboardingPayment(): boolean {
  return process.env.NEXT_PUBLIC_SKIP_ONBOARDING_PAYMENT === 'true';
}
