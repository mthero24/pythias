"use client";
import { useState } from "react";
import Link from "next/link";
import s from "./how-it-works.module.css";

const SERVICES = {
    fulfillment: {
        label: "Fulfillment Cloud",
        color: "#D3A73D",
        audience: "You own the production floor. Fulfillment Cloud is the software OS that manages it.",
        forYouIf: "Right for you if you own printers, embroidery machines, or other production equipment.",
        steps: [
            {
                icon: "🔗",
                id: "fc-step-1",
                title: "Connect Stores & Equipment",
                desc: "Link your marketplaces (Amazon, Etsy, TikTok, Shopify, and 15+ more) and connect your production hardware — DTF printers, embroidery machines, Brother GTX — using our guided setup wizard. Our team handles the technical side on-site.",
                details: ["On-site setup by our team", "Brother GTX & DTG printer support", "DTF, embroidery, sublimation, screen print", "Custom equipment on request"],
            },
            {
                icon: "⚙️",
                id: "fc-step-2",
                title: "Orders Flow Into Your Queue",
                desc: "When a customer buys on any connected channel, the order routes to your production floor automatically — queued by deadline, print type, and priority. No copy-paste, no manual sorting.",
                details: ["Auto order import from all channels", "Smart production queue routing", "Priority and deadline management", "DTF, embroidery, sublimation, screen print queues"],
            },
            {
                icon: "🚚",
                id: "fc-step-3",
                title: "Print, Pack & Ship",
                desc: "Your team fulfills the order on your own equipment. Integrated USPS, FedEx, and UPS label generation ships it directly to the customer, with tracking synced back to every marketplace automatically.",
                details: ["Automated label generation (USPS, FedEx, UPS)", "Tracking synced to every marketplace", "Packing slip and barcode printing", "Zero manual tracking entry"],
            },
            {
                icon: "📈",
                id: "fc-step-4",
                title: "Scale Your Operation",
                desc: "Track production output, inventory levels, revenue by channel, and team performance from one analytics dashboard. Optionally accept overflow orders from Commerce Cloud sellers as a fulfillment partner.",
                details: ["Unlimited order volume", "Production analytics & reporting", "Inventory reorder alerts", "Accept Commerce Cloud seller orders"],
            },
        ],
        timeline: [
            { day: "Day 1–2",   label: "Kickoff & Account Setup",  desc: "We configure your account, connect your marketplaces, and map your SKUs." },
            { day: "Day 3–5",   label: "Equipment Integration",     desc: "Our team connects your printers and production equipment on-site." },
            { day: "Day 6–8",   label: "Order Flow Testing",        desc: "We run test orders through every channel to verify routing and labels." },
            { day: "Day 9–12",  label: "Team Training",             desc: "We train your operators, managers, and admin staff on the full platform." },
            { day: "Day 13–14", label: "Go Live",                   desc: "Flip the switch. Real orders flow through Pythias with our team on standby." },
        ],
    },
    commerce: {
        label: "Commerce Cloud",
        color: "#6366f1",
        audience: "You sell the products. Vetted fulfillment partners physically print, pack, and ship every order.",
        forYouIf: "Right for you if you want to sell printed products without owning any equipment, warehouse, or staff.",
        steps: [
            {
                icon: "🛍️",
                id: "cc-step-1",
                title: "Connect Your Stores",
                desc: "Link TikTok Shop, Shopify, Etsy, Amazon, Walmart Marketplace, and 15+ more in minutes. Orders from every channel flow into one dashboard automatically.",
                details: ["18+ marketplace integrations", "One-click Shopify app install", "All orders in a single dashboard", "No CSV imports or manual sync"],
            },
            {
                icon: "📦",
                id: "cc-step-2",
                title: "Build Your Product Catalog",
                desc: "Browse hundreds of blank products stocked by fulfillment partners. Upload your artwork, set your retail prices. Commerce Cloud builds the listings and syncs them to every connected store. Nothing is printed until a customer buys.",
                details: ["Hundreds of blank products available", "Upload designs in any format", "Automatic listing sync to all stores", "No upfront inventory cost"],
            },
            {
                icon: "⚡",
                id: "cc-step-3",
                title: "Orders Route Automatically",
                desc: "When a customer buys, Commerce Cloud scores every eligible fulfillment partner on geography, price, and reliability — then routes the order to the best one. The partner prints, packs, and ships it directly to your customer.",
                details: ["Intelligent routing engine", "Scored by geo, price & reliability", "2-hour max routing time", "Automatic fallback if partner declines"],
            },
            {
                icon: "📊",
                id: "cc-step-4",
                title: "Track & Scale",
                desc: "Tracking updates flow back to every marketplace the moment the partner ships. Monitor revenue, margin, and fulfillment metrics across all channels from one analytics dashboard.",
                details: ["Auto tracking sync to all channels", "Revenue & margin analytics", "Fulfillment partner performance metrics", "No manual customer updates"],
            },
        ],
        timeline: [
            { day: "Hours 1–2",  label: "Connect Your Stores",      desc: "Link your marketplaces and set up your Pythias account. No technical setup required." },
            { day: "Hours 2–6",  label: "Build Your Catalog",        desc: "Browse blanks, upload your designs, and set retail prices. Listings sync to your stores automatically." },
            { day: "Day 1",      label: "Test Your First Order",     desc: "Place a test order to verify routing, tracking, and marketplace sync are working correctly." },
            { day: "Day 1–2",    label: "Go Live",                   desc: "Your products are live across all connected channels. First real orders start routing automatically." },
        ],
    },
};

const FAQS = [
    {
        question: "What's the difference between Fulfillment Cloud and Commerce Cloud?",
        answer: "Commerce Cloud is the selling layer — you design products, list them across marketplaces, and fulfillment partners print and ship every order. You never touch the product. Fulfillment Cloud includes everything Commerce Cloud does, plus tools to run your own production floor: job queues, equipment integration, inventory, and shipping label generation. If you own printers, you want Fulfillment Cloud. If you want to sell without owning production, Commerce Cloud is the right fit.",
    },
    {
        question: "What printers and production equipment are supported?",
        answer: "Fulfillment Cloud has native integrations for Brother GTX series DTG printers and most popular folding machines. DTF, sublimation, embroidery, and screen print workflows are all supported through the production queue. Commerce Cloud sellers don't need any equipment — fulfillment partners handle all production.",
    },
    {
        question: "How fast is Commerce Cloud onboarding vs. Fulfillment Cloud?",
        answer: "Commerce Cloud sellers can be live within 1–2 days — connect your stores, build your catalog, test an order, and go live. No equipment setup, no on-site visit required. Fulfillment Cloud onboarding takes 1–2 weeks because our team integrates your production equipment on-site and trains your floor staff.",
    },
    {
        question: "What marketplaces are supported?",
        answer: "Both products support 18+ direct integrations including Amazon, Walmart Marketplace, Target Plus, eBay, Etsy, TikTok Shop, Shopify, Wix, WooCommerce, and more. Through Mirakl and Acenda, a single connection adds 200+ additional channels.",
    },
    {
        question: "What's included in the monthly fee?",
        answer: "Fulfillment Cloud: unlimited orders, all marketplace integrations, production queue management, inventory tracking, shipping label generation, analytics, team tools, and 24/7 support — no per-order fees. Commerce Cloud: subscription tier plus a margin fee on each order (charged on your profit, not your revenue). The Free tier is $0/month.",
    },
    {
        question: "Does the demo cost anything?",
        answer: "No. The demo is a free 30-minute call with no commitment. We walk through the product and answer your specific questions — and we'll tell you honestly if Pythias isn't the right fit.",
    },
];

export default function HowItWorksContent() {
    const [active, setActive] = useState("fulfillment");
    const svc = SERVICES[active];

    return (
        <div className={s.bg}>
            {/* Hero */}
            <section className={s.hero}>
                <div className={`${s.glow} ${s.glow1}`} />
                <div className={`${s.glow} ${s.glow2}`} />
                <div className={s.wrap}>
                    <p className={s.tag}>How It Works</p>
                    <h1 className={s.h1}>
                        Two services.{" "}
                        <span className={s.accent}>One platform.</span>
                    </h1>
                    <p className={s.heroSub}>
                        Fulfillment Cloud runs your production floor. Commerce Cloud lets you sell without one.
                        Choose the path that fits your business — or use both together.
                    </p>
                    <div className={s.btns}>
                        <Link href="/#calendar-booking-section" className={s.btnGold}>Book a Free Demo</Link>
                        <Link href="/features" className={s.btnWhite}>See All Features</Link>
                    </div>
                </div>
            </section>

            {/* Steps — tabbed */}
            <section className={s.section}>
                <div className={s.wrap}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>The Process</p>
                        <h2 className={s.h2}>How each service works, step by step.</h2>
                    </div>

                    {/* Tab toggle */}
                    <div className={s.tabRow}>
                        {Object.entries(SERVICES).map(([key, sv]) => (
                            <button
                                key={key}
                                onClick={() => setActive(key)}
                                className={`${s.tab} ${active === key ? s.tabActive : ""}`}
                                style={{ "--tab-color": sv.color }}
                            >
                                {sv.label}
                            </button>
                        ))}
                    </div>

                    <p className={s.tabTagline}>{svc.audience}</p>
                    <p className={s.tabAudience}>{svc.forYouIf}</p>

                    <ol className={s.grid2} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {svc.steps.map((step, i) => (
                            <li key={step.id} id={step.id} className={s.step}>
                                <div className={s.stepHeader}>
                                    <div className={s.stepIconWrap}>
                                        <div className={s.stepIcon}>{step.icon}</div>
                                        <div className={s.stepNum} style={{ background: svc.color }}>{String(i + 1).padStart(2, "0")}</div>
                                    </div>
                                    <div>
                                        <h3 className={s.stepTitle}>{step.title}</h3>
                                        <p className={s.stepDesc}>{step.desc}</p>
                                    </div>
                                </div>
                                <hr className={s.hr} />
                                <ul className={s.details} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                    {step.details.map((d) => (
                                        <li key={d} className={s.detailRow}>
                                            <span className={s.checkIcon} style={{ color: svc.color }}>✓</span>
                                            {d}
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* Differentiator */}
            <section className={s.sectionDark}>
                <div className={s.sectionGlow} />
                <div className={s.wrap} style={{ position: "relative" }}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Not Sure Which Is Right?</p>
                        <h2 className={s.h2Light}>One question decides it.</h2>
                    </div>
                    <div className={s.diffGrid}>
                        <div className={s.diffCard}>
                            <p className={s.diffLabel} style={{ color: "#6366f1" }}>Commerce Cloud</p>
                            <p className={s.diffTitle}>You sell. Partners produce.</p>
                            <p className={s.diffDesc}>
                                No equipment, no warehouse, no staff. You design products, set prices, and sell across 18+ marketplaces.
                                Vetted fulfillment partners print, pack, and ship every order. Nothing is produced until a customer buys.
                            </p>
                            <Link href="/commerce-cloud" className={s.diffLink} style={{ color: "#6366f1" }}>Learn about Commerce Cloud →</Link>
                        </div>
                        <div className={s.diffDivider}>
                            <span className={s.diffVs}>⊃</span>
                        </div>
                        <div className={s.diffCard}>
                            <div className={s.diffLabelRow}>
                                <p className={s.diffLabel} style={{ color: "#D3A73D" }}>Fulfillment Cloud</p>
                                <span className={s.diffBadge}>Includes Commerce Cloud</span>
                            </div>
                            <p className={s.diffTitle}>You sell. You produce.</p>
                            <p className={s.diffDesc}>
                                Everything in Commerce Cloud — plus tools to run your own production floor.
                                Manage job queues, equipment, inventory, and shipping from one platform.
                                You can also accept overflow orders from other Commerce Cloud sellers as a fulfillment partner.
                            </p>
                            <Link href="/pricing" className={s.diffLink} style={{ color: "#D3A73D" }}>See Fulfillment Cloud pricing →</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Onboarding Timeline */}
            <section className={s.section}>
                <div className={s.wrap}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Onboarding Timeline</p>
                        <h2 className={s.h2}>What to expect, day by day.</h2>
                    </div>

                    {/* Tab toggle */}
                    <div className={s.tabRow}>
                        {Object.entries(SERVICES).map(([key, sv]) => (
                            <button
                                key={key}
                                onClick={() => setActive(key)}
                                className={`${s.tab} ${active === key ? s.tabActive : ""}`}
                                style={{ "--tab-color": sv.color }}
                            >
                                {sv.label}
                            </button>
                        ))}
                    </div>

                    <ol className={s.timeline} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {svc.timeline.map((t, i) => (
                            <li key={t.day} className={s.timelineItem}>
                                <div className={s.timelineLine}>
                                    <div className={s.timelineDot} style={{ background: svc.color }} />
                                    {i < svc.timeline.length - 1 && <div className={s.timelineConnector} />}
                                </div>
                                <div className={s.timelineContent}>
                                    <p className={s.timelineDay}>{t.day}</p>
                                    <p className={s.timelineLabel}>{t.label}</p>
                                    <p className={s.timelineDesc}>{t.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* FAQ */}
            <section className={s.sectionWhite}>
                <div className={s.wrapMd}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>FAQ</p>
                        <h2 className={s.h2}>Common questions.</h2>
                        <p className={s.sectionSub}>
                            More questions? Visit the <Link href="/faq" style={{ color: "#D3A73D", fontWeight: 600 }}>full FAQ page</Link>.
                        </p>
                    </div>
                    <div className={s.faqList}>
                        {FAQS.map((faq) => (
                            <details key={faq.question} className={s.faqItem}>
                                <summary>{faq.question}</summary>
                                <div className={s.faqAnswer}>
                                    <p>{faq.answer}</p>
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={s.cta}>
                <div className={s.wrapMd}>
                    <h2 className={s.ctaTitle}>Ready to get started?</h2>
                    <p className={s.ctaSub}>
                        Book a free 30-minute demo — no commitment, no credit card. We&apos;ll answer your questions
                        and tell you honestly which product fits your business.
                    </p>
                    <div className={s.btns}>
                        <Link href="/#calendar-booking-section" className={s.btnGold}>Book a Free Demo</Link>
                        <Link href="/contact" className={s.btnGray}>Contact Us</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
