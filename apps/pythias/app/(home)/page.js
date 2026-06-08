import dynamic from "next/dynamic";
import HeroSection from "./HeroSection";
import CloudsSection from "./CloudsSection";
import BenefitsSection from "./BenefitsSection";
import HowItWorksSection from "./HowItWorksSection";
import FeaturesSection from "./FeaturesSection";
import TestimonialsSection from "./TestimonialsSection";
import LeadCaptureSection from "./LeadCaptureSection";
import FAQSection from "./FAQSection";
import FinalCTASection from "./FinalCTASection";
import HomePopup from "./HomePopup";

const CalendarBookingSection = dynamic(() => import("./CalendarBookingSection"));

const reviewSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Pythias Technologies",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://pythiastechnologies.com",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: 5,
    bestRating: 5,
    worstRating: 1,
    ratingCount: 4,
  },
  review: [
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Mason Katty" },
      reviewRating: { "@type": "Rating", ratingValue: 5, bestRating: 5, worstRating: 1 },
      reviewBody: "Pythias Technologies cut our shipping time by 40% and eliminated manual order processing. Our team can now focus on growing the business instead of managing chaos.",
      name: "40% faster shipping",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Mike Rodriguez" },
      reviewRating: { "@type": "Rating", ratingValue: 5, bestRating: 5, worstRating: 1 },
      reviewBody: "The Brother GTX integration was seamless. We went from manual job tracking to fully automated production in just one week. Game changer for our POD business.",
      name: "Automated 100% of production",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Emily Chen" },
      reviewRating: { "@type": "Rating", ratingValue: 5, bestRating: 5, worstRating: 1 },
      reviewBody: "Managing orders from Etsy, Amazon, and Walmart used to be a nightmare. Now everything flows automatically through one system. Revenue up 60% in 3 months.",
      name: "60% revenue increase in 3 months",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "David Thompson" },
      reviewRating: { "@type": "Rating", ratingValue: 5, bestRating: 5, worstRating: 1 },
      reviewBody: "The inventory management alone saved us thousands in overstock and stockouts. Real-time tracking across all our products has transformed our operations.",
      name: "Eliminated stockouts",
    },
  ],
};

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <HomePopup />
      <HeroSection />
      <CloudsSection />
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
