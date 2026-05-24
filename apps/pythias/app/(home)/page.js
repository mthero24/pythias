import dynamic from "next/dynamic";
import HeroSection from "./HeroSection";
import BenefitsSection from "./BenefitsSection";
import HowItWorksSection from "./HowItWorksSection";
import FeaturesSection from "./FeaturesSection";
import TestimonialsSection from "./TestimonialsSection";
import LeadCaptureSection from "./LeadCaptureSection";
import FAQSection from "./FAQSection";
import FinalCTASection from "./FinalCTASection";

const CalendarBookingSection = dynamic(() => import("./CalendarBookingSection"));

export default function Home() {
  return (
    <>
      <HeroSection />
      <BenefitsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <LeadCaptureSection />
      <CalendarBookingSection />
      <FAQSection />
      <FinalCTASection />
    </>
  );
}
