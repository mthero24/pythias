import LandingPage from "../../components/LandingPage";

export const metadata = {
    title: "Pythias for DTF Shops — Order & Production Software",
    description:
        "DTF order management software for growing shops. Collect visual quotes, organize artwork, import Shopify and marketplace orders, run one production queue, and auto-print shipping labels — all in one platform.",
    alternates: { canonical: "https://pythiastechnologies.com/for-dtf-shops" },
    openGraph: {
        title: "Pythias for DTF Shops — Order & Production Software",
        description:
            "Manage DTF quote requests, artwork, Shopify orders, production queues, and shipping labels from one platform.",
        url: "https://pythiastechnologies.com/for-dtf-shops",
        type: "website",
    },
};

const PAINS = [
    {
        pain: "I'm tired of customer intake being a mess of texts, emails, and screenshots.",
        fix: "Customers submit a visual quote request — artwork, blank, sizes, colors, quantities — so every job arrives complete and print-ready instead of scattered across your inbox.",
    },
    {
        pain: "I'm tired of orders living in five places — email, Shopify, and shipping software.",
        fix: "Every order from Shopify and 18+ marketplaces lands in one organized queue. One screen shows what to print, for whom, and by when.",
    },
    {
        pain: "I'm tired of manually buying and printing labels for every single order.",
        fix: "Scan a finished DTF job and the shipping label prints automatically — tracking syncs straight back to the channel the customer ordered from.",
    },
    {
        pain: "I'm tired of jobs getting disorganized the busier we get.",
        fix: "Jobs auto-sort by due date and print method and are tracked by barcode, so nothing is late, nothing gets reprinted, and volume stops breaking your floor.",
    },
];

const FEATURES = [
    {
        icon: "🧾",
        title: "Visual quote intake",
        desc: "Customers upload and position their own artwork, choose blanks, and pick sizes and colors. What lands in your shop is complete and approved — no chasing details.",
    },
    {
        icon: "🖨️",
        title: "One production queue",
        desc: "All DTF (and DTG) jobs flow into a single queue sorted by deadline and print type. Your team always knows exactly what to make next.",
    },
    {
        icon: "🏷️",
        title: "Auto shipping labels on scan",
        desc: "Scan to complete a job and a USPS, FedEx, UPS, or DHL label prints automatically — no separate shipping site, no copy-pasting tracking numbers.",
    },
    {
        icon: "🛒",
        title: "Shopify + 18 marketplace import",
        desc: "Connect Shopify plus Amazon, Etsy, TikTok Shop, Walmart, and more. Orders pull in automatically and tracking confirms back on every channel.",
    },
    {
        icon: "📦",
        title: "Blank inventory tracking",
        desc: "Track blanks across every color, size, and style with automated reorder alerts before you run out mid-run.",
    },
];

export default function ForDtfShopsPage() {
    return (
        <LandingPage
            eyebrow="For DTF Shops"
            headline="Built for DTF shops growing faster than their workflow."
            sub="Manage quote requests, artwork, Shopify orders, production queues, shipping labels, and fulfillment from one platform."
            pains={PAINS}
            features={FEATURES}
        />
    );
}
