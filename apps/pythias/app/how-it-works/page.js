import s from "./how-it-works.module.css";
import Link from "next/link";

export const metadata = {
    title: "How It Works",
    description: "Learn how Pythias Technologies gets your print-on-demand operation up and running in under two weeks — from equipment hookup to full automation.",
    alternates: { canonical: "https://pythiastechnologies.com/how-it-works" },
};

const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Get Started with Pythias Technologies",
    description: "Get your print-on-demand operation up and running in under two weeks.",
    totalTime: "P14D",
    step: [
        { "@type": "HowToStep", position: 1, name: "Connect Your Equipment",      text: "Integrate your Brother GTX printers, folding machines, and other production equipment using our guided setup wizard. Our team handles the technical side on-site.", url: "https://pythiastechnologies.com/how-it-works#step-1" },
        { "@type": "HowToStep", position: 2, name: "Sync Inventory & Listings",   text: "Connect all your marketplace accounts and sync product listings across Amazon, Etsy, Walmart, Shopify, TikTok, and more.", url: "https://pythiastechnologies.com/how-it-works#step-2" },
        { "@type": "HowToStep", position: 3, name: "Automate Order Fulfillment",  text: "Orders automatically flow into production, get assigned to the right queue, printed and packed, then shipped with integrated USPS, FedEx, and UPS label generation.", url: "https://pythiastechnologies.com/how-it-works#step-3" },
        { "@type": "HowToStep", position: 4, name: "Grow Your Business",          text: "Scale effortlessly with automated workflows, real-time analytics, and intelligent inventory management.", url: "https://pythiastechnologies.com/how-it-works#step-4" },
    ],
};

const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
        { "@type": "Question", name: "What printers are supported?",                       acceptedAnswer: { "@type": "Answer", text: "We specialize in Brother GTX printer integration, including the GTX series and DTG printers. We also support most popular folding machines and can integrate with other production equipment upon request." } },
        { "@type": "Question", name: "Does it work with Etsy, Amazon, and other marketplaces?", acceptedAnswer: { "@type": "Answer", text: "Yes. We integrate with all major marketplaces including Amazon, Etsy, Walmart, TikTok, Shopify, Kohl's, and more. Orders automatically sync and flow through your production workflow." } },
        { "@type": "Question", name: "How fast is onboarding?",                            acceptedAnswer: { "@type": "Answer", text: "Most customers are up and running within 1–2 weeks. Our team comes to your warehouse and handles the technical setup, printer integration, and marketplace connections." } },
        { "@type": "Question", name: "What's included in the monthly fee?",               acceptedAnswer: { "@type": "Answer", text: "Everything. Unlimited orders, all integrations, 24/7 support, software updates, printer connectivity, shipping software, inventory management, and analytics. No hidden fees or per-transaction costs." } },
        { "@type": "Question", name: "Do you provide technical support?",                  acceptedAnswer: { "@type": "Answer", text: "Yes, we provide 24/7 technical support via chat, email, phone, and dedicated Slack channels. Our team includes print production experts who understand your workflow." } },
    ],
};

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",         item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "How It Works", item: "https://pythiastechnologies.com/how-it-works" },
    ],
};

const STEPS = [
    {
        icon: "🔗",
        id: "step-1",
        title: "Connect Your Equipment",
        desc: "Integrate your Brother GTX printers, folding machines, and other production equipment in minutes using our guided setup wizard. Our team handles the technical side on-site.",
        details: ["On-site setup by our team", "Brother GTX & DTG printer support", "Folding machine integration", "Custom equipment on request"],
    },
    {
        icon: "🔄",
        id: "step-2",
        title: "Sync Inventory & Listings",
        desc: "Connect all your marketplace accounts and sync product listings across Amazon, Etsy, Walmart, Shopify, TikTok, and more. Your inventory stays accurate across every channel automatically.",
        details: ["6+ marketplace connections", "Real-time inventory sync", "Listing management", "SKU mapping & routing"],
    },
    {
        icon: "⚙️",
        id: "step-3",
        title: "Automate Order Fulfillment",
        desc: "Orders automatically flow into production, get assigned to the right queue, printed and packed, then shipped with integrated USPS, FedEx, and UPS label generation — zero manual steps.",
        details: ["Auto order import from all channels", "Smart production queue routing", "Automated label generation", "Tracking synced back to marketplace"],
    },
    {
        icon: "📈",
        id: "step-4",
        title: "Grow Your Business",
        desc: "Scale effortlessly with automated workflows, real-time analytics, and intelligent inventory management. The more orders you take, the more Pythias saves you time.",
        details: ["Unlimited order volume", "Analytics & reporting dashboard", "Team role management", "Ongoing support & updates"],
    },
];

const TIMELINE = [
    { day: "Day 1–2",   label: "Kickoff & Account Setup",  desc: "We configure your account, connect your marketplaces, and map your SKUs." },
    { day: "Day 3–5",   label: "Equipment Integration",     desc: "Our team connects your printers and production equipment on-site." },
    { day: "Day 6–8",   label: "Order Flow Testing",        desc: "We run test orders through every channel to verify routing and labels." },
    { day: "Day 9–12",  label: "Team Training",             desc: "We train your operators, managers, and admin staff on the full platform." },
    { day: "Day 13–14", label: "Go Live",                   desc: "Flip the switch. Real orders flow through Pythias with our team on standby." },
];

const FAQS = [
    { question: "What printers are supported?",                       answer: "We specialize in Brother GTX printer integration, including the GTX series and DTG printers. We also support most popular folding machines and can integrate with other production equipment upon request." },
    { question: "Does it work with Etsy, Amazon, and other marketplaces?", answer: "Yes. We integrate with all major marketplaces including Amazon, Etsy, Walmart, TikTok, Shopify, Kohl's, and more. Orders automatically sync and flow through your production workflow." },
    { question: "How fast is onboarding?",                            answer: "Most customers are up and running within 1–2 weeks. Our team comes to your warehouse and handles the technical setup, printer integration, and marketplace connections. We provide full training and support throughout." },
    { question: "What's included in the monthly fee?",               answer: "Everything. Unlimited orders, all integrations, 24/7 support, software updates, printer connectivity, shipping software, inventory management, and analytics. No hidden fees or per-transaction costs." },
    { question: "Do you provide technical support?",                  answer: "Yes, we provide 24/7 technical support via chat, email, phone, and dedicated Slack channels. Our team includes print production experts who understand your workflow and can help optimize your operations." },
];

export default function HowItWorksPage() {
    return (
        <div className={s.bg}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            {/* Hero */}
            <section className={s.hero}>
                <div className={s.glow + " " + s.glow1} />
                <div className={s.glow + " " + s.glow2} />
                <div className={s.wrap}>
                    <p className={s.tag}>How It Works</p>
                    <h1 className={s.h1}>
                        Up and running in{" "}
                        <span className={s.accent}>under two weeks.</span>
                    </h1>
                    <p className={s.heroSub}>
                        Our team handles the setup — you focus on production. Here&apos;s exactly what the process looks like.
                    </p>
                    <div className={s.btns}>
                        <a href="/#calendar-booking-section" className={s.btnGold}>Book a Demo</a>
                        <Link href="/features" className={s.btnWhite}>See All Features</Link>
                    </div>
                </div>
            </section>

            {/* 4 Steps */}
            <section className={s.section} itemScope itemType="https://schema.org/HowTo">
                <meta itemProp="name" content="How to Get Started with Pythias Technologies" />
                <meta itemProp="totalTime" content="P14D" />
                <div className={s.wrap}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>The Process</p>
                        <h2 className={s.h2}>Four steps to full automation.</h2>
                    </div>
                    <ol className={s.grid2} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {STEPS.map((step, i) => (
                            <li
                                key={step.id}
                                id={step.id}
                                className={s.step}
                                itemProp="step"
                                itemScope
                                itemType="https://schema.org/HowToStep"
                            >
                                <div className={s.stepHeader}>
                                    <div className={s.stepIconWrap}>
                                        <div className={s.stepIcon}>{step.icon}</div>
                                        <div className={s.stepNum}>{String(i + 1).padStart(2, "0")}</div>
                                    </div>
                                    <div>
                                        <h3 className={s.stepTitle} itemProp="name">{step.title}</h3>
                                        <p className={s.stepDesc} itemProp="text">{step.desc}</p>
                                    </div>
                                </div>
                                <hr className={s.hr} />
                                <ul className={s.details} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                    {step.details.map((d) => (
                                        <li key={d} className={s.detailRow}>
                                            <span className={s.checkIcon}>✓</span>
                                            {d}
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* Onboarding Timeline */}
            <section className={s.sectionDark}>
                <div className={s.sectionGlow} />
                <div className={s.wrap} style={{ position: "relative" }}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Onboarding Timeline</p>
                        <h2 className={s.h2Light}>What to expect, day by day.</h2>
                    </div>
                    <ol className={s.timeline} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {TIMELINE.map((t, i) => (
                            <li key={t.day} className={s.timelineItem}>
                                <div className={s.timelineLine}>
                                    <div className={s.timelineDot} />
                                    {i < TIMELINE.length - 1 && <div className={s.timelineConnector} />}
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
            <section className={s.sectionWhite} itemScope itemType="https://schema.org/FAQPage">
                <div className={s.wrapMd}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>FAQ</p>
                        <h2 className={s.h2}>Common questions.</h2>
                        <p className={s.sectionSub}>Everything you need to know about getting started with Pythias.</p>
                    </div>
                    <div className={s.faqList}>
                        {FAQS.map((faq) => (
                            <details
                                key={faq.question}
                                className={s.faqItem}
                                itemProp="mainEntity"
                                itemScope
                                itemType="https://schema.org/Question"
                            >
                                <summary itemProp="name">{faq.question}</summary>
                                <div
                                    className={s.faqAnswer}
                                    itemProp="acceptedAnswer"
                                    itemScope
                                    itemType="https://schema.org/Answer"
                                >
                                    <p itemProp="text">{faq.answer}</p>
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
                        Book a free demo and we&apos;ll walk through exactly how Pythias fits your operation — no commitment required.
                    </p>
                    <div className={s.btns}>
                        <a href="/#calendar-booking-section" className={s.btnGold}>Book a Demo</a>
                        <Link href="/contact" className={s.btnGray}>Contact Us</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
