/** Explicit opt-in for local end-to-end testing; never records a payment. */
export function canSkipOnboardingPayment(): boolean {
  return process.env.NEXT_PUBLIC_SKIP_ONBOARDING_PAYMENT === 'true'
    && typeof window !== 'undefined'
    && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
}
