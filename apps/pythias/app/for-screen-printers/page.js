import LandingPage from "../../components/LandingPage";

export const metadata = {
    title: "Pythias for Screen Printers — Quote & Order Software",
    description:
        "Screen printing quote software that turns custom quote requests into production-ready orders. Customers upload artwork, choose blanks, sizes, and colors, approve pricing, and pay online — then the job flows straight into production.",
    alternates: { canonical: "https://pythiastechnologies.com/for-screen-printers" },
    openGraph: {
        title: "Pythias for Screen Printers — Quote & Order Software",
        description:
            "Stop quoting from messy emails. Visual quote intake with artwork approval, accurate pricing, and online payment.",
        url: "https://pythiastechnologies.com/for-screen-printers",
        type: "website",
    },
};

const PAINS = [
    {
        pain: "I'm tired of sending wrong quotes because the details keep changing.",
        fix: "Customers build the quote themselves — blanks, sizes, colors, quantities — so you price against complete, accurate information the first time.",
    },
    {
        pain: "I'm tired of customers sending blurry, low-res, unusable artwork.",
        fix: "Artwork is uploaded and positioned in your studio up front, so what you receive is print-ready and already approved by the customer.",
    },
    {
        pain: "I'm tired of chasing down sizes and ink colors before I can quote.",
        fix: "Every size, color, and quantity comes in with the request. Nothing to chase, nothing to guess before pricing.",
    },
    {
        pain: "I'm tired of quote requests getting buried in my email.",
        fix: "Every request lands in one organized queue instead of your inbox — so nothing slips through and follow-up is one click, not inbox archaeology.",
    },
];

const FEATURES = [
    {
        icon: "🎨",
        title: "Visual quote intake with artwork",
        desc: "Customers upload and place their own designs, choose blanks, and specify sizes and colors — every quote request arrives complete and print-ready.",
    },
    {
        icon: "💲",
        title: "Accurate pricing built in",
        desc: "Setup fees, quantity breaks, and discounts are calculated automatically so screen-print jobs get priced correctly every time.",
    },
    {
        icon: "✅",
        title: "Approve + pay online",
        desc: "Customers approve the final quote and pay online — no chasing invoices, no back-and-forth over email.",
    },
    {
        icon: "🖨️",
        title: "Converts to a production order",
        desc: "Once paid, the quote drops straight into your production queue as a ready-to-make job — no manual re-entry.",
    },
    {
        icon: "📦",
        title: "Bring-your-own-blanks pricing",
        desc: "Price using your own blank costs and supplier catalog so margins stay yours on every quote.",
    },
];

export default function ForScreenPrintersPage() {
    return (
        <LandingPage
            eyebrow="For Screen Printers"
            headline="Stop quoting from messy emails."
            sub="Customers upload artwork, place designs, choose blanks, select sizes and colors, and submit everything you need to price the job correctly."
            pains={PAINS}
            features={FEATURES}
        />
    );
}
