import dynamic from "next/dynamic";
import HeroSection from "./HeroSection";
import CloudsSection from "./CloudsSection";
import SeoAuthoritySection from "./SeoAuthoritySection";
import CommunitySection from "./CommunitySection";
import OutcomesSection from "./OutcomesSection";
import RoiCalculatorSection from "./RoiCalculatorSection";
import HowItWorksSection from "./HowItWorksSection";
import FeaturesSection from "./FeaturesSection";
import FreeAnalysisSection from "./FreeAnalysisSection";
import TestimonialsSection from "./TestimonialsSection";
import LeadCaptureSection from "./LeadCaptureSection";
import PodcastSection from "./PodcastSection";
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

export const revalidate = 300; // refresh so Video Library / hero changes appear without a rebuild

export const metadata = {
  title: { absolute: "Pythias Fulfillment Cloud & Commerce Cloud | Print-on-Demand, Fulfillment & Marketplace Automation" },
  description:
    "Pythias is print-on-demand, fulfillment, inventory management, marketplace management, warehouse, and ecommerce operations software in one platform — automate production, orders, inventory, and shipping across 18+ marketplaces.",
  keywords:
    "print-on-demand software, fulfillment software, inventory management software, marketplace management software, warehouse software, ecommerce operations software, multichannel fulfillment, order management software",
  alternates: { canonical: "https://pythiastechnologies.com" },
  openGraph: {
    title: "Pythias Fulfillment Cloud & Commerce Cloud — Print-on-Demand, Fulfillment & Marketplace Automation",
    description:
      "One platform for print-on-demand, fulfillment, inventory, marketplace management, and ecommerce operations — automate production, orders, and shipping across 18+ marketplaces.",
    url: "https://pythiastechnologies.com",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Pythias Fulfillment Cloud & Commerce Cloud" }],
  },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <HomePopup />
      <HeroSection />
      <CloudsSection />
      <OutcomesSection />
      <RoiCalculatorSection />
      <SeoAuthoritySection />
      <CommunitySection />
      <HowItWorksSection />
      <FeaturesSection />
      <FreeAnalysisSection />
      <TestimonialsSection />
      <PodcastSection />
      <LeadCaptureSection />
      <CalendarBookingSection />
      <FAQSection />
      <FinalCTASection />
    </>
  );
}
