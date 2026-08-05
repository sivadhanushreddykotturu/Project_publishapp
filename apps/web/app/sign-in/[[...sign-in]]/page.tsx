import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Logo } from "@/components/marketing/LogoMark";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-cream-100 to-paper px-6">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#0a0a0b",
            borderRadius: "1rem",
            fontFamily: "var(--font-inter), sans-serif",
          },
        }}
        fallbackRedirectUrl="/post-auth"
      />
    </main>
  );
}
