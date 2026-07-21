import dynamic from "next/dynamic";
// Garment-print-shop homepage narrative (beachhead: ecommerce garment printers).
import GarmentStyles from "./GarmentStyles";
import GarmentHeroSection from "./GarmentHeroSection";
import GarmentProblemSection from "./GarmentProblemSection";
import GarmentPipelineSection from "./GarmentPipelineSection";
import GarmentProofSection from "./GarmentProofSection";
import GarmentEconomicsSection from "./GarmentEconomicsSection";
import GarmentPricingSection from "./GarmentPricingSection";
// Retained conversion / social-proof machinery below the new narrative.
import RoiCalculatorSection from "./RoiCalculatorSection";
import TestimonialsSection from "./TestimonialsSection";
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
  title: { absolute: "Pythias — The Order-to-Ship Platform for Garment Print Shops" },
  description:
    "Pythias runs a garment print shop's whole floor: pull orders from every marketplace, print, fold, label, ship, and auto-sync tracking. Built on Premier Printing — a real DTG/DTF/embroidery shop shipping across Shopify, TikTok Shop, Walmart, Kohl's, and Target Plus.",
  keywords:
    "garment printing software, print shop management software, DTG production management, DTF workflow software, embroidery order management, screen printing shop software, multi-marketplace fulfillment for print shops, in-house print-on-demand software, Shopify print shop fulfillment",
  alternates: { canonical: "https://pythiastechnologies.com" },
  openGraph: {
    title: "Pythias — The Order-to-Ship Platform for Garment Print Shops",
    description:
      "Pull every order from every channel into one production floor — print, fold, label, ship, and auto-sync tracking. Built on a real garment shop that ships every day.",
    url: "https://pythiastechnologies.com",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Pythias — order-to-ship platform for garment print shops" }],
  },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <GarmentStyles />
      <HomePopup />
      {/* New garment-shop narrative */}
      <GarmentHeroSection />
      <GarmentProblemSection />
      <GarmentPipelineSection />
      <GarmentProofSection />
      <GarmentEconomicsSection />
      <GarmentPricingSection />
      {/* Retained conversion + social-proof machinery */}
      <RoiCalculatorSection />
      <TestimonialsSection />
      <CalendarBookingSection />
      <FAQSection />
      <FinalCTASection />
    </>
  );
}
