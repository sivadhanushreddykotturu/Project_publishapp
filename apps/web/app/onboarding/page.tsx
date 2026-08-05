import { Suspense } from "react";
import { RolePicker } from "@/components/onboarding/RolePicker";

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-cream-100 to-paper px-6 py-16">
      <Suspense>
        <RolePicker />
      </Suspense>
    </main>
  );
}
