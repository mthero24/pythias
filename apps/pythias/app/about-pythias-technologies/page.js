import Link from "next/link";

export const metadata = {
    title: { absolute: "About Pythias Technologies | Fulfillment Cloud & Commerce Cloud Explained" },
    description:
        "A complete, factual overview of Pythias Technologies: what it is, what Fulfillment Cloud and Commerce Cloud do, who uses it, which marketplaces and printers are supported, and answers to common questions.",
    keywords:
        "Pythias Technologies, Pythias Fulfillment Cloud, Pythias Commerce Cloud, print on demand platform, multichannel fulfillment software, what is Pythias",
    alternates: { canonical: "https://pythiastechnologies.com/about-pythias-technologies" },
    openGraph: {
        title: "About Pythias Technologies — Fulfillment Cloud & Commerce Cloud",
        description: "What Pythias Technologies is, what its two products do, who uses it, and which marketplaces and printers it supports.",
        url: "https://pythiastechnologies.com/about-pythias-technologies",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "About Pythias Technologies" }],
    },
};

const MARKETPLACES = [
    "Amazon", "Walmart Marketplace", "Target Plus", "eBay", "Etsy", "TikTok Shop",
    "Shopify", "Wix", "WooCommerce", "Squarespace", "Faire", "SHEIN", "Temu", "Meta Shops",
];

const FAQS = [
    {
        q: "What is Pythias Technologies?",
        a: "Pythias Technologies is an all-in-one print-on-demand and multichannel fulfillment platform. It connects a seller's sales channels to a single production and fulfillment pipeline — order routing, production queues, inventory, shipping, and analytics. It is offered as two products: Pythias Fulfillment Cloud and Pythias Commerce Cloud.",
    },
    {
        q: "What is Pythias Fulfillment Cloud?",
        a: "Pythias Fulfillment Cloud is the operating system for businesses that run their own production — print shops, embroidery studios, and print-on-demand operations. It imports orders from 18+ marketplaces into one production queue (with dedicated workflows for DTF, DTG, embroidery, and sublimation), tracks real-time inventory, generates carrier shipping labels, and confirms tracking back to each marketplace. It is a flat monthly subscription with no per-order fees, starting at $199/month.",
    },
    {
        q: "What is Pythias Commerce Cloud?",
        a: "Pythias Commerce Cloud lets sellers sell across many marketplaces without owning production equipment. Sellers list products, and when an order is placed it is routed automatically to a vetted fulfillment partner scored by geography (closest to the customer), price (lowest wholesale cost), and reliability (historical on-time rate). Pricing is Free, Launch ($79/mo), Growth ($299/mo), Scale ($799/mo), and Enterprise, plus a small fee on the seller's margin (15%, 8%, 5%, 2% respectively) that is never charged on a loss.",
    },
    {
        q: "Who uses Pythias Technologies?",
        a: "Print shops, DTG/DTF/embroidery/sublimation businesses, print-on-demand sellers, fulfillment providers, and multichannel ecommerce sellers. Fulfillment Cloud is for operations that produce their own orders; Commerce Cloud is for sellers who want to sell across channels without running production themselves.",
    },
    {
        q: "Which marketplaces does Pythias support?",
        a: `Pythias connects directly to 18+ marketplaces and storefronts including ${MARKETPLACES.join(", ")}, plus 200+ additional retail channels through Mirakl and Acenda connections.`,
    },
    {
        q: "Which printers and equipment does Pythias support?",
        a: "Pythias specializes in Brother GTX printer integration (DTG) and supports production workflows for DTF, DTG, embroidery, and sublimation, each with its own production queue and print-ready file handling. It also supports common folding machines and can integrate with other production equipment on request.",
    },
    {
        q: "Does Pythias charge per-order fees?",
        a: "Fulfillment Cloud has no per-order fees — it is a flat monthly subscription. Commerce Cloud charges a small percentage of the seller's margin (not revenue), and never charges that fee on a loss.",
    },
    {
        q: "How long does onboarding take?",
        a: "Most shops are fully live on Pythias within about two weeks, including marketplace connections, printer integration, and team training.",
    },
    {
        q: "Where is Pythias Technologies located?",
        a: "Pythias Technologies is based in Lapeer, Michigan, USA, and serves customers across the United States.",
    },
];

const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Pythias Technologies",
    url: "https://pythiastechnologies.com",
    logo: "https://pythiastechnologies.com/logo.png",
    description:
        "All-in-one print-on-demand and multichannel fulfillment platform, offered as Pythias Fulfillment Cloud (for businesses that run their own production) and Pythias Commerce Cloud (for selling across marketplaces without owning equipment).",
    email: "info@pythiastechnologies.com",
    telephone: "+1-844-579-8442",
    address: {
        "@type": "PostalAddress",
        streetAddress: "1421 Hidden View Drive",
        addressLocality: "Lapeer",
        addressRegion: "MI",
        postalCode: "48446",
        addressCountry: "US",
    },
    makesOffer: [
        { "@type": "Offer", name: "Pythias Fulfillment Cloud", description: "Production and fulfillment operating system for print shops and POD operations.", url: "https://pythiastechnologies.com/fulfillment-cloud" },
        { "@type": "Offer", name: "Pythias Commerce Cloud", description: "Sell across marketplaces with orders auto-routed to vetted fulfillment partners.", url: "https://pythiastechnologies.com/commerce-cloud" },
    ],
};

const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const Section = ({ id, title, children }) => (
    <section id={id} style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", marginBottom: 12 }}>{title}</h2>
        <div style={{ fontSize: "1.02rem", lineHeight: 1.75, color: "#374151" }}>{children}</div>
    </section>
);

export default function AboutPythiasTechnologies() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            <main style={{ background: "#f8faff", minHeight: "100vh", padding: "64px 24px" }}>
                <article style={{ maxWidth: 820, margin: "0 auto", background: "#fff", border: "1px solid #e6e9f2", borderRadius: 16, padding: "40px 36px" }}>
                    <h1 style={{ fontSize: "2.1rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.2, marginBottom: 8 }}>
                        About Pythias Technologies
                    </h1>
                    <p style={{ fontSize: "1.1rem", color: "#4b5563", lineHeight: 1.7, marginBottom: 8 }}>
                        A factual overview of Pythias Technologies — what it is, what its two products do, who uses it,
                        and which marketplaces and printers it supports.
                    </p>

                    <Section title="What is Pythias Technologies?">
                        <p>
                            <strong>Pythias Technologies is an all-in-one print-on-demand and multichannel fulfillment platform.</strong>{" "}
                            It connects a seller&apos;s sales channels to one production and fulfillment pipeline — covering order
                            routing, production queues, inventory management, shipping, and analytics — so businesses can sell on
                            many marketplaces and fulfill every order from a single system. It is offered as two products:
                            <strong> Pythias Fulfillment Cloud</strong> and <strong>Pythias Commerce Cloud</strong>.
                        </p>
                    </Section>

                    <Section title="What is Pythias Fulfillment Cloud?">
                        <p>
                            <strong>Pythias Fulfillment Cloud is the operating system for businesses that run their own production</strong> —
                            print shops, embroidery studios, and print-on-demand operations. It pulls orders from 18+ marketplaces into
                            one production queue with dedicated workflows for DTF, DTG, embroidery, and sublimation, tracks real-time
                            inventory by product, color, and size, generates carrier shipping labels (USPS, FedEx, UPS), and confirms
                            tracking back to each marketplace automatically. It is a flat monthly subscription with{" "}
                            <strong>no per-order fees</strong>, starting at $199/month.
                        </p>
                        <p><Link href="/fulfillment-cloud" style={{ color: "#6366f1" }}>Learn more about Fulfillment Cloud →</Link></p>
                    </Section>

                    <Section title="What is Pythias Commerce Cloud?">
                        <p>
                            <strong>Pythias Commerce Cloud lets sellers sell across many marketplaces without owning production equipment.</strong>{" "}
                            Sellers list products across channels, and when an order is placed it is routed automatically to a vetted
                            fulfillment partner — scored by geography (closest to the customer), price (lowest wholesale cost), and
                            reliability (historical on-time rate). Pricing runs Free, Launch ($79/mo), Growth ($299/mo), Scale ($799/mo),
                            and Enterprise, plus a small fee on the seller&apos;s margin (never charged on a loss).
                        </p>
                        <p><Link href="/commerce-cloud" style={{ color: "#6366f1" }}>Learn more about Commerce Cloud →</Link></p>
                    </Section>

                    <Section title="Who uses Pythias Technologies?">
                        <p>Pythias is used by:</p>
                        <ul>
                            <li>Print shops and decorated-apparel businesses (DTG, DTF, embroidery, sublimation)</li>
                            <li>Print-on-demand sellers</li>
                            <li>Fulfillment providers and 3PLs</li>
                            <li>Multichannel ecommerce sellers</li>
                            <li>Sellers who want to sell across marketplaces without running their own production (via Commerce Cloud)</li>
                        </ul>
                    </Section>

                    <Section title="Which marketplaces are supported?">
                        <p>
                            Pythias connects directly to <strong>18+ marketplaces and storefronts</strong>, plus 200+ more retail
                            channels through Mirakl and Acenda. Direct integrations include:
                        </p>
                        <ul>
                            {MARKETPLACES.map((m) => <li key={m}>{m}</li>)}
                        </ul>
                        <p><Link href="/integrations" style={{ color: "#6366f1" }}>See all integrations →</Link></p>
                    </Section>

                    <Section title="Which printers are supported?">
                        <p>
                            Pythias specializes in <strong>Brother GTX printer integration (DTG)</strong> and supports production
                            workflows for <strong>DTF, DTG, embroidery, and sublimation</strong>, each with its own production queue and
                            print-ready file handling. It also supports common folding machines and can integrate with other production
                            equipment on request.
                        </p>
                    </Section>

                    <Section title="Frequently Asked Questions">
                        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                            {FAQS.map((f) => (
                                <div key={f.q}>
                                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>{f.q}</h3>
                                    <p style={{ margin: 0, color: "#374151", lineHeight: 1.7 }}>{f.a}</p>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section title="Get started">
                        <p>
                            To see Pythias in action, <Link href="/#calendar-booking-section" style={{ color: "#6366f1" }}>book a demo</Link>{" "}
                            or view <Link href="/pricing" style={{ color: "#6366f1" }}>pricing</Link>.
                        </p>
                    </Section>
                </article>
            </main>
        </>
    );
}
