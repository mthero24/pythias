import dynamic from "next/dynamic";
import HeroSection from "./HeroSection";
import BenefitsSection from "./BenefitsSection";
import HowItWorksSection from "./HowItWorksSection";
import FeaturesSection from "./FeaturesSection";
import TestimonialsSection from "./TestimonialsSection";
import LeadCaptureSection from "./LeadCaptureSection";
import FAQSection from "./FAQSection";
import FinalCTASection from "./FinalCTASection";
import HomePopup from "./HomePopup";

const CalendarBookingSection = dynamic(() => import("./CalendarBookingSection"));

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What printers are supported?",
      acceptedAnswer: { "@type": "Answer", text: "We specialize in Brother GTX printer integration, including the GTX series and DTG printers. We also support most popular folding machines and can integrate with other production equipment upon request." },
    },
    {
      "@type": "Question",
      name: "Does it work with Etsy, Amazon, and other marketplaces?",
      acceptedAnswer: { "@type": "Answer", text: "Yes! We integrate with all major marketplaces including Amazon, Etsy, Walmart, Target, eBay, Shopify, and more. Orders automatically sync and flow through your production workflow." },
    },
    {
      "@type": "Question",
      name: "How fast is onboarding?",
      acceptedAnswer: { "@type": "Answer", text: "Most customers are up and running within 1-2 weeks. Our team comes to your warehouse and handles the technical setup, printer integration, and marketplace connections. We provide full training and support throughout the process." },
    },
    {
      "@type": "Question",
      name: "What's included in the monthly fee?",
      acceptedAnswer: { "@type": "Answer", text: "Everything! Unlimited orders, all integrations, 24/7 support, software updates, printer connectivity, shipping software, inventory management, and analytics. No hidden fees or per-transaction costs." },
    },
    {
      "@type": "Question",
      name: "Do you provide technical support?",
      acceptedAnswer: { "@type": "Answer", text: "Yes, we provide 24/7 technical support via chat, email, phone, and dedicated Slack channels. Our team includes print production experts who understand your workflow and can help optimize your operations." },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <HomePopup />
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
