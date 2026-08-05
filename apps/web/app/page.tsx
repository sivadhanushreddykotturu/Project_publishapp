import { Nav } from "@/components/marketing/Nav";
import { Hero } from "@/components/marketing/Hero";
import { Features } from "@/components/marketing/Features";
import { Pricing } from "@/components/marketing/Pricing";
import { Faq } from "@/components/marketing/Faq";
import { Footer } from "@/components/marketing/Footer";

export default function LandingPage() {
  return (
    <main>
      <Nav />
      <Hero />
      <Features />
      <Pricing />
      <Faq />
      <Footer />
    </main>
  );
}
