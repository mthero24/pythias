import Link from "next/link";
import s from "./commerce-cloud.module.css";
import { Tutorial } from "@pythias/mongo";
import ScreenshotGallery from "../solutions/ScreenshotGallery";

export const metadata = {
    title: "Pythias Commerce Cloud — Sell Anywhere. Fulfill Everywhere.",
    description: "Commerce Cloud lets you list products on TikTok, Shopify, Etsy, Amazon, and more — orders automatically route to fulfillment partners. No warehouse, no equipment, no production staff required.",
    alternates: { canonical: "https://pythiastechnologies.com/commerce-cloud" },
    openGraph: {
        title: "Pythias Commerce Cloud — Sell Anywhere. Fulfill Everywhere.",
        description: "Connect your selling channels. Orders automatically route to fulfillment partners. You sell — they ship.",
        url: "https://pythiastechnologies.com/commerce-cloud",
        type: "website",
    },
};

const STEPS = [
    {
        num: "1",
        icon: "🔗",
        title: "Connect your stores",
        desc: "Link TikTok Shop, Shopify, Etsy, Amazon, Walmart Marketplace, and 15+ more in minutes. Orders from every channel flow into one dashboard.",
    },
    {
        num: "2",
        icon: "📦",
        title: "Build your product catalog",
        desc: "Pick from hundreds of blank products — apparel, accessories, home goods — stocked by fulfillment partners. Upload your artwork, set your retail price. Commerce Cloud builds ready-to-sell listings and syncs them to every connected store. Nothing is printed or purchased until a customer places an order.",
    },
    {
        num: "3",
        icon: "🚀",
        title: "Orders route automatically",
        desc: "When a customer buys, Commerce Cloud selects the best fulfillment partner — fastest route, best price — and sends them the job. Tracking updates flow back to the customer.",
    },
];

const NO_NEED = [
    { icon: "🏭", text: "Warehouse or production facility" },
    { icon: "🖨️", text: "DTG printers, embroidery machines, or equipment" },
    { icon: "👷", text: "Production or fulfillment staff" },
    { icon: "📦", text: "Inventory on hand or upfront blank purchases" },
    { icon: "🚚", text: "Your own shipping accounts or carrier contracts" },
];

const YOU_GET = [
    { icon: "🛍️", text: "A professional multi-channel selling operation" },
    { icon: "⚡", text: "Automated order routing to vetted fulfillment partners" },
    { icon: "📊", text: "Real-time analytics across every channel" },
    { icon: "🎨", text: "Full design and product catalog management" },
    { icon: "💳", text: "Simple per-order wholesale billing from your wallet" },
];

const FEATURES = [
    { icon: "🛒", title: "18+ Marketplace Integrations", desc: "TikTok Shop, Shopify, Etsy, Amazon, Walmart Marketplace, eBay, Faire, and more — connect every channel you sell on." },
    { icon: "🎨", title: "Design & Product Studio", desc: "Create products, attach designs, manage variants, and sync listings across every connected storefront automatically." },
    { icon: "🗺️", title: "Intelligent Order Routing", desc: "Every order is scored by geography, price, and provider reliability — then routed to the best available fulfillment partner." },
    { icon: "💳", title: "Pre-Funded Wallet", desc: "Fund your wallet, set auto-recharge thresholds. Wholesale costs are deducted automatically at order placement — no invoice chasing." },
    { icon: "📊", title: "Analytics & Reports", desc: "Track revenue, margin, channel performance, and fulfillment metrics across all your stores from a single dashboard." },
    { icon: "🔁", title: "Automatic Tracking Updates", desc: "When a partner ships, tracking flows back through the platform and directly to your customer on every channel." },
];

const TIERS = [
    {
        name: "Free",
        price: 0,
        marginFee: "15%",
        popular: false,
        desc: "Try Commerce Cloud with no monthly cost — pay only when you make a sale.",
        features: [
            { label: "Unlimited orders" },
            { label: "1 marketplace integration" },
            { label: "50 products" },
            { label: "1 user" },
            { label: "Standard routing" },
        ],
        cta: "Get Started Free",
        ctaStyle: "outline",
        href: "https://platform.pythiastechnologies.com/register?plan=free&type=commerce",
    },
    {
        name: "Launch",
        price: 79,
        marginFee: "8%",
        popular: false,
        desc: "Get your first channels live and test new product verticals with low commitment.",
        features: [
            { label: "Unlimited orders" },
            { label: "3 marketplace integrations" },
            { label: "250 products" },
            { label: "5 users" },
            { label: "Standard routing" },
        ],
        cta: "Start Free Trial",
        ctaStyle: "outline",
        href: "https://platform.pythiastechnologies.com/register?plan=launch&type=commerce",
    },
    {
        name: "Growth",
        price: 299,
        marginFee: "5%",
        popular: true,
        desc: "For growing brands scaling across multiple channels. Example: 100 orders/month at $21 avg margin — you keep ~$1,700 after subscription and fees.",
        features: [
            { label: "Unlimited orders" },
            { label: "All integrations", gold: true },
            { label: "1,500 products" },
            { label: "15 users" },
            { label: "Priority routing" },
        ],
        cta: "Start Free Trial",
        ctaStyle: "indigo",
        href: "https://platform.pythiastechnologies.com/register?plan=growth&type=commerce",
    },
    {
        name: "Scale",
        price: 799,
        marginFee: "2%",
        popular: false,
        desc: "High-volume merchants where margin matters — the 2% fee beats Growth above ~$53k/mo wholesale spend.",
        features: [
            { label: "Unlimited orders", gold: true },
            { label: "All integrations", gold: true },
            { label: "Unlimited products", gold: true },
            { label: "50 users" },
            { label: "Priority routing + dedicated routing score", gold: true },
        ],
        cta: "Start Free Trial",
        ctaStyle: "outline",
        href: "https://platform.pythiastechnologies.com/register?plan=scale&type=commerce",
    },
    {
        name: "Enterprise",
        price: null,
        priceLabel: "Custom",
        marginFee: "Negotiated",
        popular: false,
        desc: "High-volume operations, custom integrations, and dedicated account management.",
        features: [
            { label: "Unlimited everything", gold: true },
            { label: "All integrations", gold: true },
            { label: "Unlimited users", gold: true },
            { label: "Dedicated routing priority", gold: true },
            { label: "Custom net terms", gold: true },
        ],
        cta: "Contact Us",
        ctaStyle: "dark",
        href: "/contact",
    },
];

const FAQS = [
    {
        q: "Do I need any equipment or a warehouse?",
        a: "No. Commerce Cloud is designed for sellers who want to sell products without owning production. Fulfillment partners handle printing, embroidery, packing, and shipping. You manage listings, designs, and customer experience.",
    },
    {
        q: "How does the margin fee work?",
        a: "The fee is charged on your margin — (your retail selling price) minus (the wholesale cost charged by the fulfillment partner). If you sell a shirt for $35 and the wholesale cost is $18, your margin is $17. On the Growth plan at 5%, the fee is $0.85 on that order. We never charge on a loss — if margin is zero or negative, the fee is zero.",
    },
    {
        q: "How do fulfillment partners get selected?",
        a: "Our routing engine scores every eligible provider on three factors: geography (closer to the customer = faster, cheaper shipping), wholesale price (lower cost = better score), and reliability (30-day on-time rate, defect rate, and average ship days). The highest-scoring available provider gets the order.",
    },
    {
        q: "What happens if a provider can't fulfill my order?",
        a: "If the selected provider declines or doesn't respond within 2 hours, the routing engine automatically re-runs and selects the next best available provider. If no provider can fulfill, the order enters an 'unroutable' state, the wholesale charge is refunded to your wallet, and you're notified immediately.",
    },
    {
        q: "How does my wallet work?",
        a: "Your wallet is a pre-funded balance used to pay fulfillment partners wholesale cost at the moment each order is placed. You set a minimum balance threshold and an auto-recharge amount — when your balance drops below the threshold, your card on file is charged automatically to top it up. No invoice delays, no payment holds.",
    },
    {
        q: "How does money actually work? Does Pythias handle my payments?",
        a: "No — each marketplace pays you directly. When a customer buys on Amazon, Etsy, Shopify, or any connected channel, that marketplace collects the payment and deposits it into your seller account on their platform, exactly as it would without Pythias. Pythias only touches the wholesale side: when an order routes to a fulfillment partner, the wholesale cost is debited from your pre-funded Pythias wallet. You keep everything above that cost, minus the platform fee.",
    },
    {
        q: "Does it work with Etsy or niche platforms that have heavy customization?",
        a: "Yes. Etsy is a supported integration, including personalization and variation handling — custom text, color options, and buyer-specified details flow through with the order so fulfillment partners receive exactly what needs to be produced. If you sell on a niche platform not yet in our integration list, the discovery call is the right place to ask — we add integrations regularly and can tell you what's on the roadmap.",
    },
    {
        q: "Can I use Commerce Cloud and Fulfillment Cloud together?",
        a: "Yes. If you run your own production operation on Fulfillment Cloud, you can opt in to receive Commerce Cloud orders as a fulfillment partner — turning excess capacity into revenue. The two products are designed to work side by side.",
    },
    {
        q: "What's the breakeven between Growth and Scale?",
        a: "At the Growth plan ($299/mo, 5% margin fee) vs Scale ($799/mo, 2% margin fee): the $500/mo difference in subscription cost is offset by the 3% fee reduction. If your total margin across all orders is $500 / 0.03 = ~$16,700/mo in margin, or roughly $53k/mo in wholesale spend, Scale saves you money.",
    },
];

const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Pythias Commerce Cloud",
    url: "https://pythiastechnologies.com/commerce-cloud",
    description: "Sell anywhere. Fulfill everywhere. Commerce Cloud routes your orders to fulfillment partners automatically — no warehouse or production equipment required.",
};

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",            item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Commerce Cloud",  item: "https://pythiastechnologies.com/commerce-cloud" },
    ],
};

export default async function CommerceCloudPage() {
    let walkthrough = null;
    let heroVideo = null;
    try {
        walkthrough = await Tutorial.findOne({ videoType: "walkthrough", targetPage: "/commerce-cloud", published: true })
            .select("videoUrl title description thumbnailUrl")
            .lean();
        heroVideo = await Tutorial.findOne({ videoType: "page-video", targetPage: "/commerce-cloud", placement: "Hero", published: true })
            .sort({ order: 1, createdAt: -1 })
            .select("videoUrl thumbnailUrl")
            .lean();
    } catch { /* db unavailable — skip the section */ }

    return (
        <div className={s.bg}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            {/* ── Hero ── */}
            <section className={s.hero}>
                <div className={`${s.glow} ${s.glow1}`} />
                <div className={`${s.glow} ${s.glow2}`} />
                <div className={`${s.glow} ${s.glow3}`} />
                <div className={s.wrap}>
                    <img
                        src="/commerce-cloud-logo.png"
                        alt="Pythias Commerce Cloud"
                        className={s.heroLogo}
                    />
                    <h1 className={s.h1}>
                        Sell anywhere.{" "}
                        <span className={s.accent}>Fulfill everywhere.</span>
                    </h1>
                    <p className={s.heroSub}>
                        You design the products, set the prices, and own the customer relationship.
                        When a customer buys, a vetted fulfillment partner physically prints, packs, and ships the order straight to their door — automatically, with tracking.
                        Sell across TikTok, Shopify, Etsy, Amazon, and 15+ more with no warehouse or production equipment required.
                    </p>
                    <div className={s.heroBtns}>
                        <Link href="https://platform.pythiastechnologies.com/register?type=commerce" className={s.btnHeroGold}>
                            Start Free Trial
                        </Link>
                        <Link href="/#calendar-booking-section" className={s.btnHeroGhost}>
                            Book a Discovery Call
                        </Link>
                    </div>
                    <p className={s.heroFor}>
                        Built for print-on-demand sellers, independent brands, and multi-channel boutiques — from side hustles to high-volume operations.
                        <Link href="#faq" className={s.heroFaqLink}>Questions? See FAQ ↓</Link>
                    </p>
                    <p className={s.heroDiscovery}>
                        Not sure it&apos;s a fit for your niche? The discovery call is just a conversation — no commitment, no pitch.
                    </p>
                    <div className={s.heroStats}>
                        <div className={s.stat}>
                            <div className={s.statNum}>18+</div>
                            <div className={s.statLabel}>Marketplaces</div>
                        </div>
                        <div className={s.stat}>
                            <div className={s.statNum}>2 hrs</div>
                            <div className={s.statLabel}>Max routing time</div>
                        </div>
                        <div className={s.stat}>
                            <div className={s.statNum}>$0</div>
                            <div className={s.statLabel}>Upfront inventory</div>
                        </div>
                        <div className={s.stat}>
                            <div className={s.statNum}>% margin</div>
                            <div className={s.statLabel}>Fee model — not GMV</div>
                        </div>
                    </div>
                    {heroVideo?.videoUrl && (
                        <video
                            src={heroVideo.videoUrl}
                            poster={heroVideo.thumbnailUrl || undefined}
                            autoPlay
                            muted
                            loop
                            controls
                            playsInline
                            preload="metadata"
                            style={{ width: "auto", maxWidth: "100%", maxHeight: 360, height: "auto", borderRadius: 12, display: "block", margin: "40px auto 0" }}
                        />
                    )}
                </div>
            </section>

            {/* ── No warehouse needed (Problem) ── */}
            <section className={s.sectionDark}>
                <div className={s.sectionGlow} />
                <div className={s.sectionGlow2} />
                <div className={s.wrap} style={{ position: "relative" }}>
                    <div className={s.noWarehouse}>
                        <div className={s.noWarehouseText}>
                            <p className={s.noWarehouseLabel}>Built for sellers, not producers</p>
                            <h2 className={s.noWarehouseH3}>
                                Run a real product business<br />
                                <span style={{ color: "#D3A73D" }}>without the overhead.</span>
                            </h2>
                            <p className={s.noWarehouseSub}>
                                Most e-commerce platforms assume you already have production infrastructure.
                                Commerce Cloud assumes you don&apos;t — and fills the gap with a network of
                                vetted fulfillment partners who handle everything physical.
                            </p>
                            <p className={s.noWarehouseSub} style={{ marginTop: "-8px" }}>
                                In plain terms: the fulfillment partners own the printers, the warehouse, and the production team — not you. A customer buys a shirt with your design; a partner prints it and ships it to their door. You never touch the product.
                            </p>
                            <ul className={s.noList}>
                                {NO_NEED.map((item) => (
                                    <li key={item.text} className={s.noItem}>
                                        <span className={s.noBadge}>✕</span>
                                        <span className={s.noItemText}>{item.icon} {item.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className={s.noWarehouseVisual}>
                            <p className={s.yesLabel}>What you do get</p>
                            <ul className={s.yesList}>
                                {YOU_GET.map((item) => (
                                    <li key={item.text} className={s.yesItem}>
                                        <span className={s.yesBadge}>✓</span>
                                        <span className={s.yesItemText}>{item.icon} {item.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── How it works (Solution) ── */}
            <section className={s.section}>
                <div className={s.wrap}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>How It Works</p>
                        <h2 className={s.h2}>From store connection to customer delivery — <span style={{ color: "#D3A73D" }}>automated.</span></h2>
                        <p className={s.sectionSub}>Three steps to get your first Commerce Cloud order fulfilled.</p>
                    </div>
                    <ul className={s.steps} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {STEPS.map((step) => (
                            <li key={step.num} className={s.step}>
                                <div className={s.stepNum}>{step.num}</div>
                                <span className={s.stepIcon}>{step.icon}</span>
                                <h3 className={s.stepTitle}>{step.title}</h3>
                                <p className={s.stepDesc}>{step.desc}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ── Features ── */}
            <section className={s.section}>
                <div className={s.wrap}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Platform Features</p>
                        <h2 className={s.h2}>Everything you need to sell at scale.</h2>
                        <p className={s.sectionSub}>The same powerful selling tools as Fulfillment Cloud — minus the production floor.</p>
                    </div>
                    <ul className={s.featureGrid} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {FEATURES.map((f) => (
                            <li key={f.title} className={s.featureCard}>
                                <span className={s.featureIcon}>{f.icon}</span>
                                <h3 className={s.featureTitle}>{f.title}</h3>
                                <p className={s.featureDesc}>{f.desc}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ── Screenshots ── */}
            <section className={s.screenshotsSection}>
                <div className={s.wrap}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Platform Screenshots</p>
                        <h2 className={s.h2}>Everything managed from one clean dashboard.</h2>
                        <p className={s.sectionSub}>Commerce Cloud gives you full visibility into every order, every channel, and every fulfillment partner — without touching a single spreadsheet.</p>
                    </div>
                    <ScreenshotGallery screenshots={[
                        { src: "https://images1.pythiastechnologies.com/screenshots/cc-order-routing.png",  title: "Order Routing Dashboard", sub: "See every order as it routes to a fulfillment partner — with routing score, partner selected, and expected ship date." },
                        { src: "https://images1.pythiastechnologies.com/screenshots/cc-product-studio.png", title: "Product Studio",           sub: "Build products, upload designs, set pricing, and push listings to every connected store in minutes." },
                        { src: "https://images1.pythiastechnologies.com/screenshots/cc-analytics.png",      title: "Channel Analytics",        sub: "Revenue, margin, and fulfillment rate broken down by channel — so you know where to focus your selling." },
                    ]} />
                </div>
            </section>

            {/* ── Demo video — only shown once a walkthrough is uploaded ── */}
            {walkthrough && (
                <section className={s.videoSection}>
                    <div className={s.videoGlow} />
                    <div className={s.wrap} style={{ position: "relative" }}>
                        <div className={s.head}>
                            <p className={s.sectionTag}>See It In Action</p>
                            <h2 className={s.h2Light}>{walkthrough.title || "Watch how Commerce Cloud handles your first order end-to-end."}</h2>
                            {walkthrough.description && <p className={s.sectionSubLight}>{walkthrough.description}</p>}
                        </div>
                    </div>
                    <div className={s.videoContainer}>
                        <div className={s.videoFrame}>
                            <video
                                src={walkthrough.videoUrl}
                                poster={walkthrough.thumbnailUrl || undefined}
                                controls
                                preload="metadata"
                                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* ── Pricing ── */}
            <section className={s.sectionDark}>
                <div className={s.sectionGlow} />
                <div className={s.wrap} style={{ position: "relative" }}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Pricing</p>
                        <h2 className={s.h2Light}>Subscription + a fee on your margin — not your revenue.</h2>
                        <p className={s.sectionSubLight}>
                            We only earn when you do. The margin fee is charged on{" "}
                            <strong style={{ color: "#a5b4fc" }}>(selling price − wholesale cost)</strong>,
                            not on your gross revenue.
                        </p>
                    </div>

                    <ul className={s.pricingGrid} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {TIERS.map((tier) => (
                            <li
                                key={tier.name}
                                className={`${s.card} ${tier.popular ? s.cardPopular : ""}`}
                                itemScope
                                itemType="https://schema.org/Offer"
                            >
                                {tier.popular && <span className={s.popularBadge}>Most Popular</span>}
                                <meta itemProp="name" content={`Pythias Commerce Cloud — ${tier.name}`} />
                                {tier.price > 0 && <meta itemProp="price" content={tier.price} />}
                                <meta itemProp="priceCurrency" content="USD" />

                                <p className={s.tierName}>{tier.name}</p>
                                <div className={s.price}>
                                    {tier.priceLabel ? (
                                        <span>{tier.priceLabel}</span>
                                    ) : (
                                        <>
                                            <span className={s.priceSup}>$</span>
                                            {tier.price?.toLocaleString()}
                                        </>
                                    )}
                                </div>
                                <span className={s.pricePer}>
                                    {tier.price == null ? "contact us" : tier.price === 0 ? "forever free" : "/ month"}
                                </span>

                                <div className={s.marginFee}>
                                    <span className={s.marginFeeVal}>{tier.marginFee}</span>
                                    <span className={s.marginFeeLabel}>fee on margin</span>
                                </div>

                                <p className={s.tierDesc}>{tier.desc}</p>

                                <ul className={s.limits}>
                                    {tier.features.map((f) => (
                                        <li key={f.label} className={s.limit}>
                                            <span className={f.gold ? s.checkGold : s.check}>✓</span>
                                            {f.label}
                                        </li>
                                    ))}
                                </ul>

                                <div className={s.cardFooter}>
                                    <Link
                                        href={tier.href}
                                        className={
                                            tier.ctaStyle === "indigo" ? s.btnIndigo :
                                            tier.ctaStyle === "gold"   ? s.btnGold :
                                            tier.ctaStyle === "dark"   ? s.btnDark :
                                            s.btnOutline
                                        }
                                    >
                                        {tier.cta}
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Margin fee explainer */}
                    <div className={s.explainer}>
                        <div className={s.explainerText}>
                            <h3>The margin fee, explained.</h3>
                            <p>
                                Unlike GMV-based fees that penalize you for selling high-volume, low-margin products,
                                our fee is tied to your actual profit. If you&apos;re not making money on an order, we&apos;re not making money either.
                            </p>
                            <p>
                                The fee is calculated as: <strong>(retail selling price) − (wholesale cost charged by fulfillment partner) × your fee %</strong>.
                                Wholesale cost is locked at routing time — no price surprises after the order is placed.
                            </p>
                            <p>
                                If margin is zero or negative (a loss sale), the fee is always <strong>$0</strong>.
                            </p>
                        </div>
                        <div className={s.mathCard}>
                            <p className={s.mathTitle}>Example order — Growth plan (5%)</p>
                            <div className={s.mathRow}>
                                <span className={s.mathLabel}>Customer pays (retail)</span>
                                <span className={s.mathVal}>$35.00</span>
                            </div>
                            <div className={s.mathRow}>
                                <span className={s.mathLabel}>Wholesale cost to fulfiller</span>
                                <span className={s.mathVal}>−$14.00</span>
                            </div>
                            <div className={s.mathRow}>
                                <span className={s.mathLabel}>Your margin</span>
                                <span className={s.mathVal}>$21.00</span>
                            </div>
                            <div className={s.mathRow}>
                                <span className={s.mathLabel}>Pythias fee (5% × $21)</span>
                                <span className={s.mathFee}>−$1.05</span>
                            </div>
                            <div className={s.mathTotal}>
                                <span className={s.mathTotalLabel}>You keep</span>
                                <span className={s.mathTotalVal}>$19.95</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Decision guide ── */}
            <section className={s.section}>
                <div className={s.wrapMd}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Not Sure Which Is Right?</p>
                        <h2 className={s.h2}>Fulfillment Cloud vs. Commerce Cloud.</h2>
                        <p className={s.sectionSub}>One simple question: do you own production equipment, or do you want to sell without it?</p>
                    </div>
                    <ul className={s.decideGrid} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li className={`${s.decideCard} ${s.decideCardFC}`}>
                            <span className={s.decideIcon}>🏭</span>
                            <h3 className={s.decideTitle}>Fulfillment Cloud</h3>
                            <p className={s.decideSub}>You run the production floor. Fulfillment Cloud runs the software that manages it.</p>
                            <ul className={s.decideList}>
                                {[
                                    "You own DTG printers, embroidery machines, or other equipment",
                                    "You have production staff and a facility",
                                    "You want to manage orders, inventory, and shipping from one OS",
                                    "You may want to offer overflow capacity to Commerce Cloud sellers",
                                ].map(item => (
                                    <li key={item} className={s.decideItem}>
                                        <span className={s.decideCheck} style={{ color: "#D3A73D" }}>✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/pricing" className={s.decideBtnGold}>See Fulfillment Cloud Pricing →</Link>
                        </li>
                        <li className={`${s.decideCard} ${s.decideCardCC}`}>
                            <span className={s.decideIcon}>🛍️</span>
                            <h3 className={s.decideTitle}>Commerce Cloud</h3>
                            <p className={s.decideSub}>You own the brand and the customer. Fulfillment partners handle everything physical.</p>
                            <ul className={s.decideList}>
                                {[
                                    "You want to sell products without owning production equipment",
                                    "You're expanding into new product categories without capital risk",
                                    "You sell across multiple marketplaces and want one dashboard",
                                    "You want orders fulfilled automatically — no manual routing or vendor coordination",
                                ].map(item => (
                                    <li key={item} className={s.decideItem}>
                                        <span className={s.decideCheck} style={{ color: "#a5b4fc" }}>✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="https://platform.pythiastechnologies.com/register?type=commerce" className={s.decideBtnIndigo}>Start Commerce Cloud →</Link>
                        </li>
                    </ul>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section id="faq" className={s.section} style={{ paddingTop: 0 }}>
                <div className={s.wrapMd}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>FAQ</p>
                        <h2 className={s.h2}>Common questions.</h2>
                    </div>
                    <ul className={s.faqList} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {FAQS.map((faq) => (
                            <li key={faq.q} className={s.faqItem} itemScope itemType="https://schema.org/Question">
                                <div className={s.faqQ} itemProp="name">{faq.q}</div>
                                <div className={s.faqA} itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                                    <p itemProp="text" style={{ margin: 0 }}>{faq.a}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className={s.cta}>
                <div className={s.ctaGlow} />
                <div className={s.wrapSm}>
                    <h2 className={s.ctaTitle}>Ready to sell without the overhead?</h2>
                    <p className={s.ctaSub}>
                        Start a free trial — no credit card required. Connect your first store in minutes and see how Commerce Cloud routes your first order.
                    </p>
                    <div className={s.btns}>
                        <Link href="https://platform.pythiastechnologies.com/register?type=commerce" className={s.ctaBtnGold}>
                            Start Free Trial
                        </Link>
                        <Link href="/#calendar-booking-section" className={s.ctaBtnGhost}>
                            Book a Discovery Call
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
