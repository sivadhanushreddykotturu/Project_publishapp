import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/marketing/LogoMark";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const next =
    role === "client" || role === "tester" ? `/onboarding?role=${role}` : "/post-auth";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-cream-100 to-paper px-6">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <SignUp
        appearance={{
          variables: {
            colorPrimary: "#0a0a0b",
            borderRadius: "1rem",
            fontFamily: "var(--font-inter), sans-serif",
          },
        }}
        fallbackRedirectUrl={next}
      />
    </main>
  );
}
