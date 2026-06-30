import LandingPage from "../../components/LandingPage";
import QuoteToProductionSection from "../(home)/QuoteToProductionSection";

export const metadata = {
    title: "Pythias Quote-to-Production — Custom Print Orders Without the Back-and-Forth",
    description:
        "Custom t shirt quote software and print shop quoting software in one. Customers build a visual quote request — artwork, blanks, sizes, colors — approve the final price, pay online, and the job flows straight into production.",
    alternates: { canonical: "https://pythiastechnologies.com/quote-to-production" },
    openGraph: {
        title: "Pythias Quote-to-Production — Custom Print Orders Without the Back-and-Forth",
        description:
            "From quote request to paid production order — without the back-and-forth. Visual quote builder, online approval and payment, auto production.",
        url: "https://pythiastechnologies.com/quote-to-production",
        type: "website",
    },
};

const PAINS = [
    {
        pain: "I'm tired of quotes being wrong because the details keep shifting.",
        fix: "Customers build the quote with blanks, sizes, colors, and quantities, and pricing, setup fees, and discounts are built in — so it's right once, with no re-dos.",
    },
    {
        pain: "I'm tired of customers sending bad artwork I can't actually print.",
        fix: "They upload and position their own art in your studio. What they submit is print-ready and already approved — no blurry logos, no back-and-forth.",
    },
    {
        pain: "I'm tired of approval and payment dragging on for days.",
        fix: "Customers approve the final quote and pay online in the same flow — no chasing signatures or invoices before you can start.",
    },
    {
        pain: "I'm tired of manually creating an order after every approval.",
        fix: "A paid, approved quote auto-converts into a production order and drops straight into your queue — no re-typing, no copy-paste.",
    },
];

const FEATURES = [
    {
        icon: "🧾",
        title: "Visual quote builder",
        desc: "Customers assemble their own request — blanks, sizes, colors, quantities — so every quote arrives complete and accurate.",
    },
    {
        icon: "🎨",
        title: "Artwork upload + placement",
        desc: "Designs are uploaded and positioned up front, so what you receive is print-ready and already approved by the customer.",
    },
    {
        icon: "💲",
        title: "Pricing + discounts",
        desc: "Setup fees, quantity breaks, and discounts calculate automatically so every job is priced correctly the first time.",
    },
    {
        icon: "💳",
        title: "Online approval + payment",
        desc: "Customers approve the final price and pay online in one flow — no invoice chasing, no payment delays.",
    },
    {
        icon: "🖨️",
        title: "Auto-converts to a production order",
        desc: "Once paid, the quote becomes a ready-to-make job in your production queue automatically — no manual order creation.",
    },
];

export default function QuoteToProductionPage() {
    return (
        <LandingPage
            eyebrow="Quote-to-Production"
            headline="From quote request to paid production order — without the back-and-forth."
            sub="Customers build a visual quote request — artwork, blanks, sizes, colors — approve the final price, pay online, and the job flows straight into production."
            pains={PAINS}
            features={FEATURES}
        >
            {/* The 5-step flow: Quote → Approve → Pay → Produce → Fulfill */}
            <QuoteToProductionSection />
        </LandingPage>
    );
}
