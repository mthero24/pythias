import { Urbanist } from "next/font/google";
import "./globals.css";
import Navbar from "@/componants/Navbar";
import FoundingBar from "@/componants/FoundingBar";
import Footer from "@/componants/Footer";
import ThemeProvider from "@/componants/ThemeProvider";
import AnalyticsTracker from "@/componants/AnalyticsTracker";
import GtagTracker from "@/componants/GtagTracker";
import { PageTracker } from "@pythias/backend";
import GaScripts from "@/componants/GaScripts";
import TrackingPixels from "@/componants/TrackingPixels";
import ChatWidget from "@/componants/ChatWidget";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "Pythias Technologies — Print-on-Demand Automation Platform",
    template: "%s | Pythias Technologies",
  },
  description: "Pythias Technologies: all-in-one print-on-demand platform automating production queues, shipping, inventory, marketplace sync, and analytics. Book a demo.",
  keywords: "print on demand software, custom apparel automation, DTF production management, multi-marketplace fulfillment, Shopify fulfillment software, Amazon seller tools, print shop management, embroidery job management, shipping label automation",
  authors: [{ name: "Pythias Technologies", url: "https://pythiastechnologies.com" }],
  creator: "Pythias Technologies",
  metadataBase: new URL("https://pythiastechnologies.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pythiastechnologies.com",
    siteName: "Pythias Technologies",
    title: "Pythias Technologies — Print-on-Demand Automation Platform",
    description: "Automate your entire print-on-demand operation — production queues, shipping, inventory, multi-marketplace sync, and team management all in one platform.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Pythias Technologies" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pythias Technologies — Print-on-Demand Automation Platform",
    description: "Automate your entire print-on-demand operation from one platform.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: {
    canonical: "https://pythiastechnologies.com",
  },
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pythias Technologies",
  url: "https://pythiastechnologies.com",
  logo: {
    "@type": "ImageObject",
    url: "https://pythiastechnologies.com/logo.png",
    width: 512,
    height: 512,
  },
  description: "Veteran-owned and operated all-in-one print-on-demand and multichannel fulfillment platform for custom apparel businesses — veterans helping veterans build self-sufficient businesses.",
  slogan: "Veteran-owned. Veterans helping veterans build self-sufficient businesses.",
  knowsAbout: ["Veteran-owned business", "Print on demand", "Order fulfillment", "Ecommerce"],
  address: {
    "@type": "PostalAddress",
    streetAddress: "1421 Hidden View Drive",
    addressLocality: "Lapeer",
    addressRegion: "MI",
    postalCode: "48446",
    addressCountry: "US",
  },
  telephone: "+18445798442",
  email: "info@pythiastechnologies.com",
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+18445798442",
    contactType: "customer support",
    availableLanguage: "English",
    areaServed: "US",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Pythias Technologies",
  url: "https://pythiastechnologies.com",
  description: "Print-on-demand automation platform for custom apparel businesses.",
  publisher: { "@type": "Organization", name: "Pythias Technologies" },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Pythias Technologies",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://pythiastechnologies.com",
  description: "Print-on-demand automation platform covering production queues, shipping, inventory, marketplace sync, analytics, and team management.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    seller: { "@type": "Organization", name: "Pythias Technologies" },
  },
  featureList: [
    "DTF and embroidery production queue management",
    "USPS, FedEx, and UPS shipping label automation",
    "Real-time blank inventory tracking",
    "Multi-marketplace order sync (Shopify, Amazon, Etsy, Walmart, TikTok)",
    "Production analytics and reporting",
    "Team collaboration with role-based access",
    "Label and barcode printing",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      </head>
      <body className={`${urbanist.variable} antialiased`}>
        <ThemeProvider>
          <PageTracker />
          <AnalyticsTracker />
          <GtagTracker />
          <FoundingBar />
          <Navbar />
          {children}
          <Footer />
          <ChatWidget />
        </ThemeProvider>
        <GaScripts />
        <TrackingPixels />
      </body>
    </html>
  );
}
