import LandingPage from "../../components/LandingPage";

export const metadata = {
    title: "Pythias for Shopify Print Sellers — Order Fulfillment",
    description:
        "Shopify print fulfillment software that sends store orders straight to production. Auto-import Shopify and 18+ marketplace orders into one production queue, print labels automatically, and sync tracking back — no orders lost between admin, email, and shipping software.",
    alternates: { canonical: "https://pythiastechnologies.com/for-shopify-print-sellers" },
    openGraph: {
        title: "Pythias for Shopify Print Sellers — Order Fulfillment",
        description:
            "Shopify orders should go straight to production. Auto-import, one production queue, auto labels, and tracking sync.",
        url: "https://pythiastechnologies.com/for-shopify-print-sellers",
        type: "website",
    },
};

const PAINS = [
    {
        pain: "I'm tired of orders getting lost between Shopify, email, and shipping software.",
        fix: "Every Shopify order flows automatically into one production queue, so jobs stop falling through the cracks between tools.",
    },
    {
        pain: "I'm tired of manually importing orders into my production process.",
        fix: "Orders pull in automatically the moment they're placed — no exports, no copy-paste, no manual data entry.",
    },
    {
        pain: "I'm tired of buying and printing labels by hand for every order.",
        fix: "Labels print automatically when a job is completed, and tracking syncs back to Shopify without anyone typing a number.",
    },
    {
        pain: "I'm tired of having no idea where an order actually is in production.",
        fix: "Every order has a clear status from received to shipped, so you and your customers always know exactly where it stands.",
    },
];

const FEATURES = [
    {
        icon: "🔗",
        title: "Auto order import",
        desc: "Connect Shopify plus 18+ marketplaces — Amazon, Etsy, TikTok Shop, Walmart, and more. Orders pull in automatically from every channel into one place.",
    },
    {
        icon: "🖨️",
        title: "One production queue",
        desc: "All orders land in a single queue sorted by deadline and print type, so your team always knows what to make next.",
    },
    {
        icon: "🏷️",
        title: "Auto labels + tracking sync",
        desc: "Scan a finished job to print the shipping label automatically — tracking flows straight back to Shopify and the marketplace the order came from.",
    },
    {
        icon: "📦",
        title: "Inventory accuracy",
        desc: "Real-time blank inventory with reorder alerts keeps stock counts honest across every SKU, color, and size.",
    },
    {
        icon: "📊",
        title: "Analytics",
        desc: "See revenue by channel, daily output, and fulfillment performance from one dashboard — no spreadsheets required.",
    },
];

export default function ForShopifyPrintSellersPage() {
    return (
        <LandingPage
            eyebrow="For Shopify Sellers"
            headline="Shopify orders should go straight to production."
            sub="Connect your store to your print workflow so orders don't get lost between the admin, email, shipping software, and the production floor."
            pains={PAINS}
            features={FEATURES}
        />
    );
}
