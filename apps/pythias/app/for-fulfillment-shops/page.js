import LandingPage from "../../components/LandingPage";

export const metadata = {
    title: "Pythias for Fulfillment Shops — Production & Shipping Automation",
    description:
        "Print shop production software for multichannel fulfillment. Bring Shopify, 18+ marketplace, and custom orders into one production queue, auto-print labels on scan, track blank inventory, and run your floor with team management and analytics.",
    alternates: { canonical: "https://pythiastechnologies.com/for-fulfillment-shops" },
    openGraph: {
        title: "Pythias for Fulfillment Shops — Production & Shipping Automation",
        description:
            "Bring Shopify, marketplace, and custom orders into one production queue with automated labels and shipping at scale.",
        url: "https://pythiastechnologies.com/for-fulfillment-shops",
        type: "website",
    },
};

const PAINS = [
    {
        pain: "I'm tired of pulling orders from a dozen different channels every morning.",
        fix: "Orders from Shopify and 18+ marketplaces flow into one queue automatically — no logging into a different platform for each channel.",
    },
    {
        pain: "I'm tired of buying and printing labels by hand at our volume.",
        fix: "Scan a finished job and the carrier label prints automatically — USPS, FedEx, UPS, or DHL — with tracking synced back to the order's channel.",
    },
    {
        pain: "I'm tired of having no real queue or visibility into the floor.",
        fix: "Every job is sorted by deadline and method and tracked by barcode, so managers can see exactly what's in progress, what's late, and what shipped.",
    },
    {
        pain: "I'm tired of a disorganized floor that's quietly losing us money.",
        fix: "Jobs auto-sort and route by print type so nothing gets reprinted, missed, or made out of order — the floor runs to a plan, not to chaos.",
    },
];

const FEATURES = [
    {
        icon: "🔗",
        title: "18+ marketplace + Shopify import",
        desc: "Connect Amazon, Etsy, TikTok Shop, Walmart, eBay, Shopify, and more. Every order pulls in automatically and confirms tracking back on its channel.",
    },
    {
        icon: "🖨️",
        title: "One production queue, every method",
        desc: "DTF, DTG, embroidery, screen print, and sublimation jobs all flow into a single queue sorted by deadline, type, and priority.",
    },
    {
        icon: "🏷️",
        title: "Auto labels on scan",
        desc: "Scan to complete a job and a USPS, FedEx, UPS, or DHL label prints automatically — no separate shipping software, no manual entry.",
    },
    {
        icon: "📦",
        title: "Blank inventory + reorder alerts",
        desc: "Real-time blank inventory across every SKU, color, and size, with automated reorder alerts before you run out mid-run.",
    },
    {
        icon: "👥",
        title: "Team management + analytics",
        desc: "Role-based access, badge-scan floor login, and reporting on output, efficiency, and revenue by channel — all from one dashboard.",
    },
];

export default function ForFulfillmentShopsPage() {
    return (
        <LandingPage
            eyebrow="For Fulfillment Shops"
            headline="Bring Shopify, marketplace, and custom orders into one production queue."
            sub="Run high-volume fulfillment from a single floor: every channel's orders sorted into one queue, labels and shipping automated on scan, and inventory, team, and analytics built for scale."
            pains={PAINS}
            features={FEATURES}
        />
    );
}
