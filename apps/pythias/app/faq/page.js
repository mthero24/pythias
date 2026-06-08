import Link from "next/link";
import s from "./faq.module.css";

export const metadata = {
    title: "FAQ — Pythias Technologies",
    description: "Answers to the most common questions about Pythias Fulfillment Cloud and Commerce Cloud — what they do, how pricing works, which marketplaces are supported, and how to get started.",
    alternates: { canonical: "https://pythiastechnologies.com/faq" },
    openGraph: {
        title: "FAQ — Pythias Technologies",
        description: "Everything you need to know about Pythias Fulfillment Cloud and Commerce Cloud.",
        url: "https://pythiastechnologies.com/faq",
        type: "website",
    },
};

const CATEGORIES = [
    {
        id: "getting-started",
        label: "Getting Started",
        color: "#D3A73D",
        faqs: [
            {
                q: "What does Pythias Technologies actually do?",
                a: "Pythias builds software for print-on-demand businesses and print shops. Depending on which product you use, it either helps you run your own production operation (Fulfillment Cloud) or lets you sell printed products across 18+ marketplaces without owning any equipment at all (Commerce Cloud). In both cases, orders flow in from your selling channels and get fulfilled — either by your team or by vetted partners.",
            },
            {
                q: "What's the difference between Fulfillment Cloud and Commerce Cloud?",
                a: "Commerce Cloud is the selling layer: you design products, list them across marketplaces, and we route each order to a vetted fulfillment partner who prints, packs, and ships it. You never touch the product. Fulfillment Cloud includes everything Commerce Cloud does, plus tools to run your own production floor — job queues, equipment integration, inventory, shipping label generation, and team management. If you own printers or a production facility, you want Fulfillment Cloud. If you just want to sell without owning production, Commerce Cloud is the right fit.",
            },
            {
                q: "Who is Pythias built for?",
                a: "Fulfillment Cloud is for print shops, print-on-demand businesses, and fulfillment operations that own production equipment — DTF printers, embroidery machines, DTG, sublimation, screen print, etc. Commerce Cloud is for independent brands, boutique shop owners, and multi-channel sellers who want to sell printed products without owning any equipment or warehouse space. Both products work for businesses from side-hustle scale up to high-volume operations.",
            },
            {
                q: "How fast is onboarding? What does setup involve?",
                a: "Most customers are up and running within two weeks. Our team handles the technical setup — printer integration, marketplace connections, and workflow configuration. We offer both on-site setup (for Fulfillment Cloud production floors) and fully remote onboarding. Full training and support is included throughout.",
            },
            {
                q: "Does the demo cost anything? Is there a commitment?",
                a: "No cost, no commitment. The demo is a free 30-minute call where we walk through the product and answer your questions specific to your business. You won't be pressured to sign up on the call.",
            },
            {
                q: "Is there a free trial?",
                a: "Yes. Commerce Cloud has a free tier ($0/month) so you can connect a store and test the workflow before paying anything. Fulfillment Cloud offers a free trial period — pricing details are on the pricing page.",
            },
        ],
    },
    {
        id: "fulfillment-cloud",
        label: "Fulfillment Cloud",
        color: "#D3A73D",
        faqs: [
            {
                q: "What printers and production equipment are supported?",
                a: "We have native integrations for Brother GTX series DTG printers and most popular folding machines. DTF, sublimation, embroidery, and screen print workflows are all supported through the production queue. If you have equipment not on the standard list, our team can typically integrate it — ask during your demo.",
            },
            {
                q: "How does order routing into my production queue work?",
                a: "When a customer places an order on any connected marketplace (Amazon, Etsy, Shopify, TikTok, etc.), Fulfillment Cloud pulls it automatically and places it in your production queue — sorted by deadline, print type, and priority. Your team sees a clean job list on the production floor dashboard. No copy-paste, no CSV imports.",
            },
            {
                q: "What's included in the monthly fee?",
                a: "Everything: unlimited orders, all marketplace integrations, production queue management, inventory tracking, shipping label generation (USPS, FedEx, UPS), analytics, team collaboration tools, and 24/7 support. No per-order fees, no hidden costs.",
            },
            {
                q: "Can I accept orders from Commerce Cloud sellers as a fulfillment partner?",
                a: "Yes. If you run a Fulfillment Cloud operation and have available production capacity, you can opt in to receive overflow orders from Commerce Cloud sellers. Your shop appears in the fulfillment partner network and gets scored on price, geography, and reliability. This turns unused capacity into additional revenue.",
            },
        ],
    },
    {
        id: "commerce-cloud",
        label: "Commerce Cloud",
        color: "#6366f1",
        faqs: [
            {
                q: "Do I need a warehouse, equipment, or staff?",
                a: "No. Commerce Cloud is built specifically for sellers who want to sell printed products without owning any production infrastructure. Fulfillment partners own the printers, the warehouse, and the production team — not you. A customer buys a shirt with your design; a partner prints it and ships it to their door. You never touch the product.",
            },
            {
                q: "How does the product catalog work? When does printing happen?",
                a: "You browse blank products (t-shirts, hoodies, mugs, accessories, and more) stocked by fulfillment partners, upload your artwork, and set your retail prices. Commerce Cloud creates ready-to-sell listings and syncs them to every connected store. Nothing is printed or purchased until a customer places an order — there's no upfront inventory cost.",
            },
            {
                q: "How are fulfillment partners selected for each order?",
                a: "Our routing engine scores every eligible partner on three factors: geography (closer to the customer = faster, cheaper shipping), wholesale price (lower cost = better score), and reliability (30-day on-time rate, defect rate, and average ship days). The highest-scoring available partner gets the order automatically.",
            },
            {
                q: "What happens if a fulfillment partner can't fulfill my order?",
                a: "If the selected partner declines or doesn't respond within 2 hours, the routing engine re-runs and assigns the next best available partner. If no partner can fulfill, the order enters an 'unroutable' state, the wholesale charge is refunded to your wallet, and you're notified immediately.",
            },
            {
                q: "Does it work with Etsy or platforms with heavy customization?",
                a: "Yes. Etsy is a supported integration, including personalization and variation handling — custom text, color options, and buyer-specified details flow through with the order so fulfillment partners receive exactly what needs to be produced. If you sell on a niche platform not yet in our integration list, the discovery call is the right place to ask — we add integrations regularly.",
            },
        ],
    },
    {
        id: "pricing",
        label: "Pricing & Billing",
        color: "#10b981",
        faqs: [
            {
                q: "How does the Commerce Cloud margin fee work?",
                a: "The fee is charged on your margin — (your retail selling price) minus (the wholesale cost charged by the fulfillment partner). If you sell a shirt for $35 and the wholesale cost is $14, your margin is $21. On the Growth plan at 5%, the fee is $1.05. You keep $19.95. We never charge on a loss — if margin is zero or negative, the fee is zero.",
            },
            {
                q: "How does money work? Does Pythias handle my payments?",
                a: "No — each marketplace pays you directly. When a customer buys on Amazon, Etsy, Shopify, or any connected channel, that marketplace collects payment and deposits it into your seller account exactly as it would without Pythias. Pythias only touches the wholesale side: when an order routes to a fulfillment partner, the wholesale cost is debited from your pre-funded Pythias wallet.",
            },
            {
                q: "How does the wallet work?",
                a: "Your wallet is a pre-funded balance used to pay fulfillment partners at the moment each order is placed. You set a minimum balance threshold and an auto-recharge amount — when your balance drops below the threshold, your card on file is charged automatically to top it up. No invoice delays, no payment holds.",
            },
            {
                q: "What's the breakeven between Commerce Cloud Growth and Scale plans?",
                a: "Growth is $299/month at a 5% margin fee. Scale is $799/month at a 2% margin fee. The $500/month difference in subscription is offset by the 3% fee reduction when your total monthly margin reaches $500 ÷ 0.03 = ~$16,700. In practical terms: if you're doing roughly $53k/month in wholesale spend, Scale saves you money.",
            },
            {
                q: "Are there per-order fees on Fulfillment Cloud?",
                a: "No. Fulfillment Cloud charges a flat monthly subscription with no per-order fees and no transaction costs. Unlimited orders are included at every tier.",
            },
        ],
    },
    {
        id: "integrations",
        label: "Integrations & Marketplaces",
        color: "#8b5cf6",
        faqs: [
            {
                q: "Which marketplaces and platforms are supported?",
                a: "18+ direct integrations including Amazon, Walmart Marketplace, Target Plus, eBay, Wayfair, Etsy, Faire, TikTok Shop, SHEIN, Temu, Meta Shops, Pinterest Shopping, Shopify, Wix, WooCommerce, Squarespace, and more. Through Mirakl and Acenda partnerships, a single connection unlocks 200+ additional channels including Zalando, Macy's, Nordstrom, Kohl's, Best Buy, and others. See the full list on the integrations page.",
            },
            {
                q: "Does Walmart Marketplace work? I thought Walmart only sells its own products.",
                a: "Walmart Marketplace is a separate program from Walmart's own retail operation — it's an open seller platform (similar to Amazon Marketplace) where third-party brands list and sell their products. Pythias integrates with Walmart Marketplace's seller API to pull your orders, confirm shipments, and sync tracking.",
            },
            {
                q: "Can I connect my own website (Shopify, Wix, WooCommerce, etc.)?",
                a: "Yes. All major D2C platforms are supported. For Shopify, install the Pythias app from the Shopify App Store for a one-click connection. Wix, WooCommerce, and Squarespace connect via API key. Orders from your own store flow through the same production workflow as any marketplace order.",
            },
            {
                q: "Can I use Commerce Cloud and Fulfillment Cloud at the same time?",
                a: "Yes. If you run your own production on Fulfillment Cloud, you can also opt in to receive Commerce Cloud orders as a fulfillment partner — turning your excess capacity into additional revenue. The two products are designed to work side by side.",
            },
        ],
    },
    {
        id: "support",
        label: "Support & Technical",
        color: "#3b82f6",
        faqs: [
            {
                q: "What kind of support is included?",
                a: "24/7 support via chat, email, phone, and dedicated Slack channels. Our team includes people with hands-on print production experience — not generic tech support. We understand your workflow and can help optimize it, not just answer tickets.",
            },
            {
                q: "How does shipping label generation work?",
                a: "When an order is completed in production, Pythias generates the shipping label automatically using your connected carrier accounts (USPS, FedEx, UPS). Tracking numbers are generated and synced back to every marketplace channel so customers receive automatic tracking updates — no manual steps.",
            },
            {
                q: "Is my data secure? Do you store customer payment information?",
                a: "We do not store or process customer payment card data. All payments are handled by the marketplaces and Stripe (for wallet top-ups). Order data, designs, and business information are stored securely with role-based access controls so only the right team members can see sensitive information.",
            },
        ],
    },
];

const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: CATEGORIES.flatMap(cat =>
        cat.faqs.map(faq => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
        }))
    ),
};

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "FAQ",  item: "https://pythiastechnologies.com/faq" },
    ],
};

export default function FAQPage() {
    return (
        <div className={s.bg}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            {/* ── Hero ── */}
            <section className={s.hero}>
                <div className={s.heroGlow} />
                <div className={s.wrap}>
                    <p className={s.heroTag}>Help Center</p>
                    <h1 className={s.h1}>Frequently Asked <span className={s.accent}>Questions</span></h1>
                    <p className={s.heroSub}>
                        Everything you need to know about Fulfillment Cloud and Commerce Cloud —
                        what they do, how they differ, how pricing works, and how to get started.
                    </p>
                    <div className={s.heroNav}>
                        {CATEGORIES.map(cat => (
                            <a key={cat.id} href={`#${cat.id}`} className={s.heroNavChip} style={{ "--chip-color": cat.color }}>
                                {cat.label}
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FAQ categories ── */}
            <section className={s.main}>
                <div className={s.wrap}>
                    {CATEGORIES.map(cat => (
                        <div key={cat.id} id={cat.id} className={s.category}>
                            <div className={s.catHeader}>
                                <span className={s.catDot} style={{ background: cat.color }} />
                                <h2 className={s.catTitle}>{cat.label}</h2>
                            </div>
                            <ul className={s.faqList}>
                                {cat.faqs.map(faq => (
                                    <li key={faq.q} className={s.faqItem} itemScope itemType="https://schema.org/Question">
                                        <p className={s.faqQ} itemProp="name">{faq.q}</p>
                                        <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                                            <p className={s.faqA} itemProp="text">{faq.a}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ── */}
            <section className={s.cta}>
                <div className={s.ctaGlow} />
                <div className={s.wrapSm}>
                    <h2 className={s.ctaTitle}>Still have questions?</h2>
                    <p className={s.ctaSub}>
                        Book a free 30-minute discovery call — no commitment, no pitch. We&apos;ll answer your specific questions
                        and tell you honestly whether Pythias is the right fit for your business.
                    </p>
                    <div className={s.ctaBtns}>
                        <Link href="/#calendar-booking-section" className={s.btnGold}>Book a Free Discovery Call</Link>
                        <Link href="/contact" className={s.btnGhost}>Send a Message</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
