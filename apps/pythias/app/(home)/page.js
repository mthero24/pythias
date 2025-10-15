import HeroSection from "./HeroSection";
import BenefitsSection from "./BenefitsSection";
import HowItWorksSection from "./HowItWorksSection";
import FeaturesSection from "./FeaturesSection";
import TestimonialsSection from "./TestimonialsSection";
import LeadCaptureSection from "./LeadCaptureSection";
import CalendarBookingSection from "./CalendarBookingSection";
import FAQSection from "./FAQSection";
import FinalCTASection from "./FinalCTASection";
import { Divider } from "@mui/material";

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
