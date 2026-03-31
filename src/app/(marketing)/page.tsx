import { DemoPreviewSection } from "@/components/marketing/demo-preview-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { OfferSection } from "@/components/marketing/offer-section";
import { ProblemSection } from "@/components/marketing/problem-section";
import { SolutionSection } from "@/components/marketing/solution-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <DemoPreviewSection />
      <ProblemSection />
      <SolutionSection />
      <OfferSection />
      <FinalCtaSection />
    </>
  );
}
