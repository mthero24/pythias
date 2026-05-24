import { Urbanist } from "next/font/google";
import "./globals.css";
import Navbar from "@/componants/Navbar";
import Footer from "@/componants/Footer";
import ThemeProvider from "@/componants/ThemeProvider";
import AnalyticsTracker from "@/componants/AnalyticsTracker";
import GtagTracker from "@/componants/GtagTracker";
import { PageTracker } from "@pythias/backend";
import Script from "next/script";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "Pythias Technologies — Print-on-Demand Automation Platform",
    template: "%s | Pythias Technologies",
  },
  description: "Pythias Technologies is an all-in-one print-on-demand software platform for custom apparel businesses. Automate production queues, shipping, inventory, marketplace sync, analytics, and team management.",
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
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pythias Technologies",
  url: "https://pythiastechnologies.com",
  description: "All-in-one print-on-demand automation platform for custom apparel businesses.",
  sameAs: [],
  contactPoint: { "@type": "ContactPoint", contactType: "sales", availableLanguage: "English" },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Pythias Technologies",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "Print-on-demand automation platform covering production queues, shipping, inventory, marketplace sync, analytics, and team management.",
  offers: { "@type": "Offer", seller: { "@type": "Organization", name: "Pythias Technologies" } },
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      </head>
      <body className={`${urbanist.variable} antialiased`}>
        <ThemeProvider>
          <PageTracker />
          <AnalyticsTracker />
          <GtagTracker />
          <Navbar />
          {children}
          <Footer />
        </ThemeProvider>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-Q27ZSTSXVH" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-Q27ZSTSXVH', { send_page_view: false });
          gtag('config', 'AW-18171939038');
        `}</Script>
      </body>
    </html>
  );
}
