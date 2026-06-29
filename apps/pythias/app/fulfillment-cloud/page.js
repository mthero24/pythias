import Link from "next/link";
import s from "./fulfillment-cloud.module.css";
import ScreenshotGallery from "../solutions/ScreenshotGallery";
import { Tutorial } from "@pythias/mongo";

export const metadata = {
    title: "Pythias Fulfillment Cloud — The Production OS for Print Shops",
    description: "Fulfillment Cloud connects your printers, marketplaces, inventory, and team in one platform. Orders flow in from Amazon, Etsy, Shopify, and 15+ more — your team sees exactly what to print, labels generate automatically, and tracking syncs back to every channel.",
    alternates: { canonical: "https://pythiastechnologies.com/fulfillment-cloud" },
    openGraph: {
        title: "Pythias Fulfillment Cloud — The Production OS for Print Shops",
        description: "One platform for your entire print operation — production queues, marketplace sync, inventory, shipping, and analytics.",
        url: "https://pythiastechnologies.com/fulfillment-cloud",
        type: "website",
    },
};

const STEPS = [
    {
        num: "1",
        icon: "🔗",
        title: "Connect your stores & equipment",
        desc: "Link your marketplaces — Amazon, Etsy, Shopify, TikTok, Walmart, and 15+ more — and connect your production hardware. DTG printers, DTF equipment, embroidery machines, and more integrate through our guided setup. Our team handles the technical install on-site.",
    },
    {
        num: "2",
        icon: "⚙️",
        title: "Orders drop into your production queue",
        desc: "Every order from every channel lands in one production queue — automatically sorted by deadline, print type, and priority. Your team sees a clean job list: what to make, what size, what design, for which customer. No spreadsheets, no inbox hunting.",
    },
    {
        num: "3",
        icon: "🏷️",
        title: "Print, scan, ship",
        desc: "When your team completes a job, they scan a barcode. A shipping label (USPS, FedEx, or UPS) prints automatically. Tracking syncs back to the customer's marketplace — Amazon, Etsy, Shopify, wherever they ordered — without anyone manually entering a number.",
    },
    {
        num: "4",
        icon: "📊",
        title: "Run your operation from the dashboard",
        desc: "Track daily output, monitor inventory levels, review revenue by channel, and manage your team — all from one dashboard. Set auto-reorder alerts for blanks. Pull production reports. See exactly where every order stands.",
    },
];

const FEATURES = [
    {
        icon: "🖨️",
        title: "Production Queue",
        color: "#D3A73D",
        desc: "All orders from all channels flow into one sorted queue. Your team sees exactly what to print — DTF (direct-to-film), DTG, embroidery, sublimation, or screen print — organized by deadline and type. No order gets lost or made in the wrong order.",
    },
    {
        icon: "🛒",
        title: "Marketplace Sync",
        color: "#6366f1",
        desc: "Connect Amazon, Etsy, Shopify, TikTok Shop, Walmart Marketplace, eBay, and 15+ more. Orders pull automatically. Tracking confirms automatically. You stop logging into five different platforms every morning.",
    },
    {
        icon: "📦",
        title: "Inventory Tracking",
        color: "#10b981",
        desc: "Real-time blank inventory across every SKU — every color, size, and style. Set minimum stock levels and get automated reorder alerts before you run out mid-run. Supplier management built in.",
    },
    {
        icon: "🚚",
        title: "Shipping & Labels",
        color: "#3b82f6",
        desc: "USPS, FedEx, and UPS label generation at order completion. Rate shopping, carrier selection, and tracking sync all happen automatically. No separate shipping software, no copy-pasting tracking numbers.",
    },
    {
        icon: "🤖",
        title: "Pythias AI",
        color: "#8b5cf6",
        desc: "Production forecasting predicts your workload so you can staff correctly. AI mockup generation creates product images from your designs. Listing copy assistance writes marketplace descriptions trained on your catalog.",
    },
    {
        icon: "👥",
        title: "Team & Floor Management",
        color: "#ef4444",
        desc: "Role-based access so operators, managers, and admins each see what they need. Badge scan login for the production floor — no passwords. Built-in messaging, shift management, and activity logs.",
    },
    {
        icon: "🏷️",
        title: "Label & Barcode Printing",
        color: "#f59e0b",
        desc: "Production pick labels, packing slips, and barcodes print directly from the dashboard. No third-party label tools. Scan to complete a job, trigger a shipping label, and update the order — all in one scan.",
    },
    {
        icon: "📈",
        title: "Analytics & Reporting",
        color: "#14b8a6",
        desc: "Daily output reports, line efficiency, revenue by channel, and custom date-range exports. Know exactly how many units your team produced, how long each job took, and which channels drive the most margin.",
    },
    {
        icon: "🧾",
        title: "Customer Invoicing",
        color: "#0ea5e9",
        desc: "Email customers a secure pay link for custom or phone orders — or mark them paid for cash. Payment lands straight in your connected Stripe account and auto-deposits to your bank.",
    },
];

const BEFORE_AFTER = [
    { before: "Orders arrive across 5 separate inboxes and platforms",        after: "All orders land in one sorted production queue" },
    { before: "Someone manually figures out what to print and for whom",       after: "Each job shows exactly what to make, what size, what design" },
    { before: "Shipping labels purchased from a separate website",             after: "Labels print automatically when a job is completed" },
    { before: "Tracking numbers entered manually into each marketplace",        after: "Tracking syncs to every channel automatically" },
    { before: "Inventory counted by hand or tracked in spreadsheets",          after: "Real-time blank inventory with auto-reorder alerts" },
    { before: "Reporting means exporting CSVs and building your own charts",   after: "Production, revenue, and channel analytics in one dashboard" },
];

const WHO = [
    { icon: "🖨️", label: "DTG & DTF print shops" },
    { icon: "🧵", label: "Embroidery operations" },
    { icon: "🎨", label: "Screen print & sublimation shops" },
    { icon: "🛍️", label: "Multi-channel print-on-demand sellers" },
    { icon: "📦", label: "Print fulfillment services" },
    { icon: "📈", label: "Shops scaling beyond spreadsheets" },
];

const TIERS = [
    {
        name: "Starter", price: 199, popular: false,
        desc: "Perfect for growing shops ready to automate their first workflows.",
        href: "https://platform.pythiastechnologies.com/register?plan=starter",
        cta: "Get Started", ctaStyle: "outline",
        limits: [
            { label: "500 orders / mo" }, { label: "250 products" }, { label: "100 designs" },
            { label: "2 integrations" }, { label: "5 users included" }, { label: "$15 / extra user" },
        ],
    },
    {
        name: "Professional", price: 599, popular: true,
        desc: "For established shops scaling across multiple channels.",
        href: "https://platform.pythiastechnologies.com/register?plan=professional",
        cta: "Get Started", ctaStyle: "gold",
        limits: [
            { label: "3,000 orders / mo" }, { label: "1,500 products" }, { label: "500 designs" },
            { label: "5 integrations" }, { label: "10 users included" }, { label: "$12 / extra user" },
        ],
    },
    {
        name: "Business", price: 1499, popular: false,
        desc: "High-volume operations with complex multi-channel workflows.",
        href: "https://platform.pythiastechnologies.com/register?plan=business",
        cta: "Get Started", ctaStyle: "outline",
        limits: [
            { label: "15,000 orders / mo" }, { label: "10,000 products" }, { label: "2,000 designs" },
            { label: "All integrations", gold: true }, { label: "25 users included" }, { label: "$10 / extra user" },
        ],
    },
    {
        name: "Scale", price: 3000, popular: false,
        desc: "Unlimited everything for large, fast-growing fulfillment centers.",
        href: "https://platform.pythiastechnologies.com/register?plan=scale",
        cta: "Get Started", ctaStyle: "outline",
        limits: [
            { label: "Unlimited orders", gold: true }, { label: "Unlimited products", gold: true },
            { label: "Unlimited designs", gold: true }, { label: "All integrations", gold: true },
            { label: "50 users included" }, { label: "$8 / extra user" },
        ],
    },
    {
        name: "Enterprise", price: null, priceLabel: "Custom", popular: false,
        desc: "Dedicated database, your own branded app, and an on-site engineer.",
        href: "/contact", cta: "Contact Us", ctaStyle: "dark",
        limits: [
            { label: "Unlimited orders", gold: true }, { label: "Unlimited everything", gold: true },
            { label: "All integrations", gold: true }, { label: "Unlimited users", gold: true },
            { label: "Dedicated database", gold: true }, { label: "Own branded app", gold: true },
        ],
    },
];

const OVERAGES = [
    { resource: "Extra Orders",      starter: "$0.25 / order",   pro: "$0.15 / order",   biz: "$0.08 / order" },
    { resource: "Extra Products",    starter: "$1.50 / product", pro: "$0.75 / product", biz: "$0.35 / product" },
    { resource: "Extra Designs",     starter: "$0.50 / design",  pro: "$0.25 / design",  biz: "$0.12 / design" },
    { resource: "Extra Integration", starter: "$75 / mo",        pro: "Upgrade required",biz: "Upgrade required" },
];

const PRICING_FAQS = [
    { q: "Can I change plans as my business grows?", a: "Yes — upgrade or downgrade at any time. Upgrades take effect immediately; downgrades apply at the start of your next billing cycle." },
    { q: "What happens if I exceed my monthly limits?", a: "For Starter, Professional, and Business tiers, usage beyond your limits is billed at the overage rates shown in the table below. You'll receive automated alerts at 75%, 90%, and 100% of each limit." },
    { q: "What integrations are included?", a: "Starter and Professional include up to 2 and 5 Pythias Connect integrations respectively, chosen from our full library: Amazon, Etsy, Walmart, Shopify, TikTok, Faire, and more. Business, Scale, and Enterprise get all integrations." },
    { q: "Is there a setup fee?", a: "No setup fee for Starter through Scale. Enterprise plans include a setup fee starting at $15,000 for a dedicated engineer, data migration, and 30-day post-launch support." },
    { q: "What's included in remote onboarding?", a: "Remote onboarding ($3,000) is 5 days of live remote sessions, 4 hours per day, covering data import, printer configuration, marketplace connections, and team training. Available for any tier." },
];

const FAQS = [
    {
        q: "What equipment does Fulfillment Cloud support?",
        a: "Native integrations for Brother GTX series DTG printers and most popular folding machines. DTF, sublimation, embroidery, and screen print production workflows are all supported through the queue system. If you have equipment not on the standard list, our team can typically integrate it — ask during your demo.",
    },
    {
        q: "I already use Shopify / Etsy / Amazon seller tools. Will Fulfillment Cloud replace those?",
        a: "No — Fulfillment Cloud connects to those platforms via API and pulls your orders. You keep your storefronts and seller accounts exactly as they are. Fulfillment Cloud is the back-end production system, not a replacement for your selling channels.",
    },
    {
        q: "How long does setup take?",
        a: "Most operations are fully live within two weeks. Our team handles the on-site equipment integration, marketplace connections, and staff training. Remote onboarding is also available for $3,000 — five days of live sessions, 4 hours per day.",
    },
    {
        q: "What's the difference between Fulfillment Cloud and Commerce Cloud?",
        a: "Fulfillment Cloud is for businesses that own their own production equipment. Commerce Cloud is for sellers who want to sell printed products without owning any equipment — orders route to vetted fulfillment partners who handle production. Fulfillment Cloud includes everything Commerce Cloud does, plus the production floor management layer.",
    },
    {
        q: "Can Fulfillment Cloud shops accept orders from Commerce Cloud sellers?",
        a: "Yes. If you run a Fulfillment Cloud operation with available capacity, you can opt in to receive overflow orders from Commerce Cloud sellers. Your shop gets scored on price, geography, and on-time rate — then matched to orders automatically. It's a way to turn unused production capacity into additional revenue.",
    },
    {
        q: "Is there a free trial or a setup fee?",
        a: "No setup fee for Starter through Scale. Every plan includes self-service onboarding at no extra cost. A free 30-minute demo call is available — no commitment, no credit card required.",
    },
];

const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Pythias Fulfillment Cloud",
    url: "https://pythiastechnologies.com/fulfillment-cloud",
    description: "Fulfillment Cloud is the production OS for print shops — connecting orders, equipment, inventory, and shipping in one platform.",
};

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",              item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Fulfillment Cloud", item: "https://pythiastechnologies.com/fulfillment-cloud" },
    ],
};

export default async function FulfillmentCloudPage() {
    let walkthrough = null;
    let heroVideo = null;
    try {
        walkthrough = await Tutorial.findOne({ videoType: "walkthrough", targetPage: "/fulfillment-cloud", published: true })
            .select("videoUrl title description thumbnailUrl")
            .lean();
        heroVideo = await Tutorial.findOne({ videoType: "page-video", targetPage: "/fulfillment-cloud", placement: "Hero", published: true })
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
                    <img src="/fullfilment_cloud_transparant.png" alt="Pythias Fulfillment Cloud" className={s.heroLogo} />
                    <h1 className={s.h1}>
                        The production OS for{" "}
                        <span className={s.accent}>your print shop.</span>
                    </h1>
                    <p className={s.heroSub}>
                        Orders from Amazon, Etsy, Shopify, TikTok, and 15+ more flow into one production queue.
                        Your team sees exactly what to print. Labels generate when a job is done. Tracking syncs back automatically.
                        No spreadsheets, no inbox juggling, no manual shipping label entry.
                    </p>
                    <p className={s.heroFor}>
                        Built for DTG, DTF, embroidery, screen print, and sublimation shops — from 2-person operations to large fulfillment centers.
                    </p>
                    <div className={s.heroBtns}>
                        <Link href="/#calendar-booking-section" className={s.btnHeroGold}>Book a Free Demo</Link>
                        <Link href="/pricing" className={s.btnHeroGhost}>See Pricing</Link>
                    </div>
                    <p className={s.heroCta}>30-min call · No commitment · No credit card</p>
                    <div className={s.heroStats}>
                        <div className={s.stat}><div className={s.statNum}>18+</div><div className={s.statLabel}>Marketplace integrations</div></div>
                        <div className={s.stat}><div className={s.statNum}>2 wks</div><div className={s.statLabel}>Average onboarding</div></div>
                        <div className={s.stat}><div className={s.statNum}>24/7</div><div className={s.statLabel}>Support included</div></div>
                        <div className={s.stat}><div className={s.statNum}>$0</div><div className={s.statLabel}>Per-transaction fees</div></div>
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

            {/* ── Plain-English explainer ── */}
            <section className={s.section}>
                <div className={s.wrapMd}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>What It Actually Does</p>
                        <h2 className={s.h2}>Your print shop, without the chaos.</h2>
                        <p className={s.sectionSub}>
                            Most print shops grow into a tangle of disconnected tools — one for each marketplace, a spreadsheet for production, a separate site for shipping labels.
                            Fulfillment Cloud replaces all of it with one platform built specifically for print operations.
                        </p>
                    </div>
                    <div className={s.beforeAfter}>
                        <div className={s.baCol}>
                            <p className={s.baHeader} style={{ color: "#ef4444" }}>Without Pythias</p>
                            <ul className={s.baList} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {BEFORE_AFTER.map(row => (
                                    <li key={row.before} className={s.baItem}>
                                        <span className={s.baBadgeBad}>✕</span>
                                        <span>{row.before}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className={s.baCol}>
                            <p className={s.baHeader} style={{ color: "#10b981" }}>With Fulfillment Cloud</p>
                            <ul className={s.baList} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {BEFORE_AFTER.map(row => (
                                    <li key={row.after} className={s.baItem}>
                                        <span className={s.baBadgeGood}>✓</span>
                                        <span>{row.after}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Who it's for ── */}
            <section className={s.sectionDark}>
                <div className={s.sectionGlow} />
                <div className={s.wrap} style={{ position: "relative" }}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Who It&apos;s For</p>
                        <h2 className={s.h2Light}>Built for shops that own their production.</h2>
                        <p className={s.sectionSubLight}>
                            If you own printers, embroidery machines, or other production equipment and sell across marketplaces,
                            Fulfillment Cloud is the OS that ties it all together.
                        </p>
                    </div>
                    <ul className={s.whoGrid} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {WHO.map(w => (
                            <li key={w.label} className={s.whoCard}>
                                <span className={s.whoIcon}>{w.icon}</span>
                                <span className={s.whoLabel}>{w.label}</span>
                            </li>
                        ))}
                    </ul>
                    <div className={s.whoNote}>
                        <p>
                            <strong style={{ color: "#fff" }}>Don&apos;t own equipment?</strong>{" "}
                            <span style={{ color: "rgba(255,255,255,0.55)" }}>
                                Check out{" "}
                                <Link href="/commerce-cloud" style={{ color: "#a5b4fc", fontWeight: 600 }}>Commerce Cloud</Link>
                                {" "}— sell printed products across 18+ marketplaces with no equipment required.
                                Vetted fulfillment partners handle all production.
                            </span>
                        </p>
                    </div>
                </div>
            </section>

            {/* ── How it works ── */}
            <section className={s.section}>
                <div className={s.wrap}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>How It Works</p>
                        <h2 className={s.h2}>Four steps from order to delivery.</h2>
                        <p className={s.sectionSub}>Once set up, the entire flow runs automatically. Your team focuses on printing — Pythias handles everything else.</p>
                    </div>
                    <ul className={s.steps} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {STEPS.map(step => (
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
            <section className={s.sectionDark}>
                <div className={s.sectionGlow} />
                <div className={s.wrap} style={{ position: "relative" }}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>What&apos;s Included</p>
                        <h2 className={s.h2Light}>Nine products. One platform. One price.</h2>
                        <p className={s.sectionSubLight}>Every Fulfillment Cloud plan includes the full product suite — no add-on fees for individual modules.</p>
                    </div>
                    <ul className={s.featureGrid} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {FEATURES.map(f => (
                            <li key={f.title} className={s.featureCard}>
                                <div className={s.featureIconBox} style={{ background: f.color + "22", color: f.color }}>{f.icon}</div>
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
                        <h2 className={s.h2}>See exactly what your team will use every day.</h2>
                        <p className={s.sectionSub}>Fulfillment Cloud is designed to be used on the production floor — clean, fast, and scannable without training.</p>
                    </div>
                    <ScreenshotGallery screenshots={[
                        { src: "https://images1.pythiastechnologies.com/screenshots/fc-production-queue.png", title: "Production Queue",    sub: "All orders sorted by deadline, print type, and priority — your team always knows what to work on next." },
                        { src: "https://images1.pythiastechnologies.com/screenshots/fc-order-detail.png",     title: "Order Detail View",   sub: "Every job shows the design file, blank spec, size, and shipping destination in one scan-ready view." },
                        { src: "https://images1.pythiastechnologies.com/screenshots/fc-analytics.png",        title: "Analytics Dashboard", sub: "Daily output, revenue by channel, and inventory levels — all in one place without building a single report." },
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
                            <h2 className={s.h2Light}>{walkthrough.title || "Watch a full walkthrough of Fulfillment Cloud."}</h2>
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
            <section id="pricing" className={s.section}>
                <div className={s.wrap}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Pricing</p>
                        <h2 className={s.h2}>One flat monthly rate. No per-order fees.</h2>
                        <p className={s.sectionSub}>Every plan includes the full product suite. Upgrade when your order volume grows. Annual billing available — <Link href="/contact" style={{ color: "#D3A73D" }}>contact us</Link> for a quote.</p>
                    </div>
                    <ul className={s.pricingGrid} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {TIERS.map(tier => (
                            <li key={tier.name} className={`${s.pricingCard} ${tier.popular ? s.pricingCardPopular : ""}`} itemScope itemType="https://schema.org/Offer">
                                {tier.popular && <span className={s.popularBadge}>Most Popular</span>}
                                <meta itemProp="name" content={`Pythias Fulfillment Cloud — ${tier.name}`} />
                                {tier.price && <meta itemProp="price" content={tier.price} />}
                                <meta itemProp="priceCurrency" content="USD" />
                                <p className={s.tierName}>{tier.name}</p>
                                <div className={s.tierPrice}>
                                    {tier.priceLabel ? <span>{tier.priceLabel}</span> : <><span className={s.tierPriceSup}>$</span>{tier.price?.toLocaleString()}</>}
                                </div>
                                <span className={s.tierPricePer}>{tier.price ? "/ month" : "contact us"}</span>
                                <p className={s.tierDesc}>{tier.desc}</p>
                                <ul className={s.tierLimits} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                    {tier.limits.map(l => (
                                        <li key={l.label} className={s.tierLimit}>
                                            <span className={l.gold ? s.checkGold : s.check}>✓</span>
                                            {l.label}
                                        </li>
                                    ))}
                                </ul>
                                <div className={s.tierFooter}>
                                    <Link href={tier.href} className={tier.ctaStyle === "gold" ? s.btnTierGold : tier.ctaStyle === "dark" ? s.btnTierDark : s.btnTierOutline}>
                                        {tier.cta}
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ── Overages ── */}
            <section className={s.sectionDark}>
                <div className={s.sectionGlow} />
                <div className={s.wrap} style={{ position: "relative" }}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Overages</p>
                        <h2 className={s.h2Light}>Pay only for what you use beyond your plan.</h2>
                        <p className={s.sectionSubLight}>Scale and Enterprise have no limits and no overage charges.</p>
                    </div>
                    <div className={s.tableWrap}>
                        <table className={s.table}>
                            <thead><tr><th>Resource</th><th>Starter</th><th>Professional</th><th>Business</th></tr></thead>
                            <tbody>
                                {OVERAGES.map(row => (
                                    <tr key={row.resource}>
                                        <td>{row.resource}</td><td>{row.starter}</td><td>{row.pro}</td><td>{row.biz}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className={s.tableNote}>Automated alerts at 75%, 90%, and 100% of your monthly limits keep you in control.</p>
                </div>
            </section>

            {/* ── Onboarding ── */}
            <section className={s.section}>
                <div className={s.wrap}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Onboarding</p>
                        <h2 className={s.h2}>We get you up and running fast.</h2>
                        <p className={s.sectionSub}>Every plan includes self-service onboarding. Prefer hands-on help? We have you covered.</p>
                    </div>
                    <ul className={s.onboardGrid} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li className={s.onboardCard}>
                            <span className={s.onboardIcon}>💻</span>
                            <h3 className={s.onboardTitle}>Remote Onboarding</h3>
                            <p className={s.onboardPrice}>$3,000</p>
                            <p className={s.onboardDesc}>One week of live remote sessions — 4 hours per day — covering data import, printer configuration, marketplace connections, and team training.</p>
                            <ul className={s.onboardBullets}>
                                {["Live Zoom sessions, 4 hrs/day Mon–Fri", "Data import & migration", "Printer & hardware configuration", "Marketplace connection setup", "Team training & walkthrough"].map(b => (
                                    <li key={b} className={s.onboardBullet}><span className={s.checkGold}>✓</span> {b}</li>
                                ))}
                            </ul>
                        </li>
                        <li className={s.onboardCard}>
                            <span className={s.onboardIcon}>🏭</span>
                            <h3 className={s.onboardTitle}>On-Site Onboarding</h3>
                            <p className={s.onboardPrice}>From $15,000</p>
                            <p className={s.onboardDesc}>A dedicated Pythias engineer comes to your facility. Includes flights, hotel, full data migration, hardware install, and 30-day post-launch support. Enterprise tier.</p>
                            <ul className={s.onboardBullets}>
                                {["Dedicated engineer at your warehouse", "Complete production install", "Full data migration", "On-site hardware & printer setup", "30-day post-launch dedicated support"].map(b => (
                                    <li key={b} className={s.onboardBullet}><span className={s.checkGold}>✓</span> {b}</li>
                                ))}
                            </ul>
                        </li>
                    </ul>
                </div>
            </section>

            {/* ── Pricing FAQ ── */}
            <section className={s.section} style={{ paddingTop: 0 }}>
                <div className={s.wrapMd}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Pricing FAQ</p>
                        <h2 className={s.h2}>Common pricing questions.</h2>
                    </div>
                    <ul className={s.faqList} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {PRICING_FAQS.map(faq => (
                            <li key={faq.q} className={s.faqItem}>
                                <div className={s.faqQ}>{faq.q}</div>
                                <div className={s.faqA}><p style={{ margin: 0 }}>{faq.a}</p></div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ── Product FAQ ── */}
            <section className={s.section} style={{ paddingTop: 0 }}>
                <div className={s.wrapMd}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>FAQ</p>
                        <h2 className={s.h2}>Common questions.</h2>
                    </div>
                    <ul className={s.faqList} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {FAQS.map(faq => (
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

            {/* ── Decision guide ── */}
            <section className={s.decideSection}>
                <div className={s.wrap}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Not Sure Which Is Right?</p>
                        <h2 className={s.h2}>Fulfillment Cloud vs. Commerce Cloud.</h2>
                        <p className={s.sectionSub}>One question decides it: do you own production equipment, or do you want to sell without it?</p>
                    </div>
                    <ul className={s.decideGrid} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li className={`${s.decideCard} ${s.decideCardFC}`}>
                            <span className={s.decideIcon}>🏭</span>
                            <h3 className={`${s.decideTitle} ${s.decideTitleLight}`}>Choose Fulfillment Cloud</h3>
                            <p className={`${s.decideSub} ${s.decideSubLight}`}>You run the production floor. Fulfillment Cloud runs the software that manages it.</p>
                            <ul className={s.decideList}>
                                {[
                                    "You own DTG printers, embroidery machines, or other equipment",
                                    "You have production staff and a physical facility",
                                    "You want to manage orders, inventory, and shipping from one platform",
                                    "You may want to accept overflow orders from Commerce Cloud sellers",
                                ].map(item => (
                                    <li key={item} className={`${s.decideItem} ${s.decideItemLight}`}>
                                        <span style={{ color: "#D3A73D", flexShrink: 0 }}>✓</span>{item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/#calendar-booking-section" className={s.decideBtnGold}>Book a Fulfillment Cloud Demo →</Link>
                        </li>
                        <li className={`${s.decideCard} ${s.decideCardCC}`}>
                            <span className={s.decideIcon}>🛍️</span>
                            <h3 className={`${s.decideTitle} ${s.decideTitleDark}`}>Choose Commerce Cloud</h3>
                            <p className={`${s.decideSub} ${s.decideSubDark}`}>You own the brand and the customer. Fulfillment partners handle everything physical.</p>
                            <ul className={s.decideList}>
                                {[
                                    "You want to sell products without owning production equipment",
                                    "You're expanding into new categories without capital risk",
                                    "You sell across multiple marketplaces and want one dashboard",
                                    "You want orders fulfilled automatically with no vendor coordination",
                                ].map(item => (
                                    <li key={item} className={`${s.decideItem} ${s.decideItemDark}`}>
                                        <span style={{ color: "#6366f1", flexShrink: 0 }}>✓</span>{item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/commerce-cloud" className={s.decideBtnIndigo}>Learn About Commerce Cloud →</Link>
                        </li>
                    </ul>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className={s.cta}>
                <div className={s.ctaGlow} />
                <div className={s.wrapSm}>
                    <h2 className={s.ctaTitle}>Ready to run a tighter operation?</h2>
                    <p className={s.ctaSub}>
                        Book a free 30-minute demo and we&apos;ll walk through exactly how Fulfillment Cloud fits your shop —
                        your equipment, your channels, your team size.
                    </p>
                    <div className={s.btns}>
                        <Link href="/#calendar-booking-section" className={s.ctaBtnGold}>Book a Free Demo</Link>
                        <Link href="/pricing" className={s.ctaBtnGhost}>See Pricing</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
