import { ClerkProvider } from "@clerk/nextjs";
import { Nav } from "@/components/marketing/Nav";
import { Hero } from "@/components/marketing/Hero";
import { SocialProof } from "@/components/marketing/SocialProof";
import { Features } from "@/components/marketing/Features";
import { Testimonials } from "@/components/marketing/Testimonials";
import { AgencySection } from "@/components/marketing/AgencySection";
import { Pricing } from "@/components/marketing/Pricing";
import { Problem } from "@/components/marketing/Problem";
import { TesterCta } from "@/components/marketing/TesterCta";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Faq } from "@/components/marketing/Faq";
import { Footer } from "@/components/marketing/Footer";

export const dynamic = "force-dynamic";

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_bm9ibGUtZ29iYmxlci04OC5jbGVyay5hY2NvdW50cy5kZXYk";

export default function LandingPage() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <main className="min-h-screen bg-[#F6F7FB] text-slate-900 font-sans antialiased selection:bg-[#4F37FE]/15 selection:text-[#4F37FE]">
        <Nav />
        <Hero />
        <Problem />
        <Features />
        <AgencySection />
        <Pricing />
        <SocialProof />
        <Testimonials />
        <TesterCta />
        <Faq />
        <FinalCta />
        <Footer />
      </main>
    </ClerkProvider>
  );
}
