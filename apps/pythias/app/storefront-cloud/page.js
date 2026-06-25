import Link from "next/link";
import s from "./storefront-cloud.module.css";
import { Tutorial } from "@pythias/mongo";
import ScreenshotGallery from "../solutions/ScreenshotGallery";

export const metadata = {
    title: "Pythias Storefront Cloud — The AI-Native Online Store Builder",
    description: "Storefront Cloud is the AI-native online store builder that beats Shopify and Wix — production, profit analytics, marketing, reviews, and SEO are all built in, not bolted on through an app store. Describe your store and AI builds it. Checkout flows straight into Pythias fulfillment.",
    alternates: { canonical: "https://pythiastechnologies.com/storefront-cloud" },
    openGraph: {
        title: "Pythias Storefront Cloud — The AI-Native Online Store Builder",
        description: "Build a high-converting online store with AI. Everything Shopify and Wix charge extra for is built in — and checkout pipes straight into fulfillment.",
        url: "https://pythiastechnologies.com/storefront-cloud",
        type: "website",
    },
};

const STEPS = [
    {
        num: "1",
        icon: "✨",
        title: "Describe your store",
        desc: "Tell the AI builder what you sell, in plain language. It generates a complete store — homepage, landing pages, sections, collections, copy, and real product photos rendered with AI scene images. No theme wrestling, no blank canvas.",
    },
    {
        num: "2",
        icon: "🎛️",
        title: "Refine anything with AI",
        desc: "Every section has an \"edit with AI\" button. Change the layout, rewrite the copy, swap the imagery, restructure a collage — just describe it. Or fine-tune by hand with pre-built themes and a full CMS. It's your store, your way.",
    },
    {
        num: "3",
        icon: "🚚",
        title: "Sell — orders fulfill themselves",
        desc: "Modern single-page checkout takes the order, charges the card, and applies tax. The order flows straight into the Pythias fulfillment pipeline — printed, packed, and shipped with tracking. No integration glue, no app to wire up.",
    },
];

const NO_NEED = [
    { icon: "🧩", text: "An app store and a dozen monthly app subscriptions" },
    { icon: "📈", text: "A separate analytics tool to see real profit, not just revenue" },
    { icon: "✉️", text: "A bolt-on email/SMS platform billed on top of your plan" },
    { icon: "⭐", text: "A third-party reviews app with its own monthly fee" },
    { icon: "🔌", text: "Integration glue between your store and your fulfillment" },
];

const YOU_GET = [
    { icon: "🤖", text: "An AI that builds and edits your store from plain language" },
    { icon: "📊", text: "True profit analytics — not just top-line revenue" },
    { icon: "📣", text: "Email, SMS, automations, and AI campaigns built in" },
    { icon: "⭐", text: "Verified-buyer reviews with AI pros/cons, native" },
    { icon: "🏭", text: "A built-in competitive fulfillment network behind checkout" },
];

const FEATURES = [
    { icon: "✨", title: "AI Site Builder", desc: "Describe your store in plain language and the AI builds sections, landing pages, copy, and real product photos with AI scene images. Per-section \"edit with AI\" lets you refine anything by just describing the change." },
    { icon: "🎨", title: "Themes, CMS & Collections", desc: "Pre-built themes and a full CMS, plus collections and Atlas-powered search with faceted filters — so shoppers find exactly what they want, fast." },
    { icon: "🛒", title: "Modern Single-Page Checkout", desc: "One-screen Stripe checkout with address-based tax, express wallets, a slide-out cart drawer, cross-sell, and seller-configurable gift add-ons — engineered for the lowest-friction conversion." },
    { icon: "🏷️", title: "Discounts, Gift Cards & Reviews", desc: "Discounts and promo codes, gift cards, and native verified-buyer reviews & ratings with AI-generated pros/cons summaries. No third-party apps, no extra fees." },
    { icon: "🔍", title: "SEO, Schema & Product Feed", desc: "Built-in SEO, structured-data schema, and a universal product feed that syndicates to Google, Bing, Meta, Pinterest, and TikTok — get found and sell everywhere." },
    { icon: "📣", title: "Marketing Automation", desc: "Email and SMS, abandoned-cart recovery, AI-written campaigns, signup popups, and post-purchase flows — a full marketing platform built into your store, not bolted on." },
    { icon: "👤", title: "Buyer Accounts & Rewards", desc: "Buyer login and accounts with rewards redemption at checkout, order history, and tracking — the loyalty layer that keeps customers coming back." },
    { icon: "📊", title: "Analytics That Show Profit", desc: "Live visitors, traffic and acquisition, conversion funnel, and Core Web Vitals per page — plus true profit analytics, not just revenue. Know what's actually working." },
    { icon: "🚚", title: "Shipping, Policies & A/B Testing", desc: "A full shipping rate engine, AI-draftable store policies, and built-in A/B testing on popups, sections, and offers — optimize without bolting on another tool." },
];

const TIERS = [
    {
        name: "Starter",
        price: 49,
        popular: false,
        desc: "Launch a complete, AI-built store and start selling with everything built in from day one.",
        features: [
            { label: "AI site builder + themes & CMS" },
            { label: "Single-page Stripe checkout" },
            { label: "Reviews, SEO & product feed" },
            { label: "Email/SMS marketing automation" },
            { label: "Direct pipe to Pythias fulfillment" },
        ],
        cta: "Start Free Trial",
        ctaStyle: "outline",
        href: "https://platform.pythiastechnologies.com/register?plan=starter&type=storefront",
    },
    {
        name: "Pro",
        price: 149,
        popular: true,
        desc: "For growing brands that want the full AI-native toolkit — profit analytics, automations, and A/B testing built in.",
        features: [
            { label: "Everything in Starter", gold: true },
            { label: "True profit analytics", gold: true },
            { label: "Buyer accounts + rewards" },
            { label: "A/B testing + abandoned cart" },
            { label: "AI campaigns + post-purchase flows" },
        ],
        cta: "Start Free Trial",
        ctaStyle: "indigo",
        href: "https://platform.pythiastechnologies.com/register?plan=pro&type=storefront",
    },
    {
        name: "Enterprise",
        price: 399,
        popular: false,
        desc: "High-volume stores wanting custom domains at scale, priority support, and the full power of the Pythias network.",
        features: [
            { label: "Everything in Pro", gold: true },
            { label: "Priority fulfillment routing", gold: true },
            { label: "Advanced segmentation", gold: true },
            { label: "Custom domains + dedicated support", gold: true },
            { label: "Mobile app add-on ready", gold: true },
        ],
        cta: "Start Free Trial",
        ctaStyle: "dark",
        href: "https://platform.pythiastechnologies.com/register?plan=enterprise&type=storefront",
    },
];

const FAQS = [
    {
        q: "How is Storefront Cloud different from Shopify or Wix?",
        a: "Two ways. First, it's AI-native: you describe your store in plain language and the builder creates sections, landing pages, copy, and real product photos — then lets you refine any section by just describing the change. Second, it's built-in, not an app store: production, profit analytics, marketing, reviews, and SEO are all native. With Shopify and Wix you stitch together a dozen paid apps to get the same capabilities, and pay a monthly fee for each. With Storefront Cloud they're part of the platform.",
    },
    {
        q: "What does \"built-in, not app-store\" actually mean for my costs?",
        a: "On other platforms, the base plan is just the shell — reviews, email/SMS, advanced analytics, SEO tools, and abandoned-cart recovery each come from a separate app with its own monthly subscription. Those add up fast. Storefront Cloud includes all of it in your plan. One bill, no app sprawl, no surprise per-app fees.",
    },
    {
        q: "How does the AI site builder work?",
        a: "Describe what you sell and the look you want, and the AI generates a full store — homepage, landing pages, sections, copy, and real product photos rendered as AI scene images. Every section then has an \"edit with AI\" button: change the layout, rewrite copy, swap imagery, or restructure a collage by describing it. You can also edit everything by hand with pre-built themes and the CMS.",
    },
    {
        q: "What is \"true profit analytics\"?",
        a: "Most store platforms show you revenue. Storefront Cloud shows you profit — because it knows your fulfillment cost on every order through the built-in network. You see which products, channels, and campaigns actually make money, not just which ones drive top-line sales.",
    },
    {
        q: "How do orders get fulfilled?",
        a: "Checkout flows straight into the Pythias fulfillment pipeline — no integration to wire up, no glue code. When a customer buys, the order is produced, packed, and shipped with tracking by the built-in fulfillment network. You run the store; the network handles everything physical.",
    },
    {
        q: "Can I sell on other channels too, or just my store?",
        a: "Both. Your store comes with a universal product feed that syndicates to Google, Bing, Meta, Pinterest, and TikTok, so you can reach shoppers wherever they are. And because Storefront Cloud is part of the Pythias network, your storefront, fulfillment, and commerce data stay connected in one closed loop.",
    },
    {
        q: "Is there a mobile app for my store?",
        a: "Yes — as an add-on. For $99/month you get a white-label native mobile app for your store, on both iOS and Android, branded as your own. It's a Storefront Cloud add-on, available on any plan.",
    },
    {
        q: "How does Storefront Cloud fit with Fulfillment Cloud and Commerce Cloud?",
        a: "Storefront Cloud is the third pillar of the Pythias network. Fulfillment Cloud runs production operations, Commerce Cloud routes orders to fulfillment partners across marketplaces, and Storefront Cloud is your own direct-to-customer store — with checkout piping into the same fulfillment network. Data flows across all three in one closed loop, so your store, your selling channels, and your production stay in sync.",
    },
];

const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Pythias Storefront Cloud",
    url: "https://pythiastechnologies.com/storefront-cloud",
    description: "The AI-native online store builder that beats Shopify and Wix — production, profit analytics, marketing, reviews, and SEO are all built in. Checkout flows straight into Pythias fulfillment.",
};

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",             item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Storefront Cloud",  item: "https://pythiastechnologies.com/storefront-cloud" },
    ],
};

export default async function StorefrontCloudPage() {
    let walkthrough = null;
    let heroVideo = null;
    try {
        walkthrough = await Tutorial.findOne({ videoType: "walkthrough", targetPage: "/storefront-cloud", published: true })
            .select("videoUrl title description thumbnailUrl")
            .lean();
        heroVideo = await Tutorial.findOne({ videoType: "page-video", targetPage: "/storefront-cloud", placement: "Hero", published: true })
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
                    <p className={s.heroTag}>Pythias Storefront Cloud</p>
                    <h1 className={s.h1}>
                        Describe your store.{" "}
                        <span className={s.accent}>AI builds it.</span>
                    </h1>
                    <p className={s.heroSub}>
                        The AI-native online store builder that beats Shopify and Wix. Tell it what you sell and it builds your store —
                        sections, landing pages, copy, and real product photos. Reviews, marketing, profit analytics, and SEO are all built in,
                        not bolted on through an app store. And checkout flows straight into the Pythias fulfillment network — no integration glue.
                    </p>
                    <div className={s.heroBtns}>
                        <Link href="https://platform.pythiastechnologies.com/register?type=storefront" className={s.btnHeroGold}>
                            Start Free Trial
                        </Link>
                        <Link href="/#calendar-booking-section" className={s.btnHeroGhost}>
                            Book a Discovery Call
                        </Link>
                    </div>
                    <p className={s.heroFor}>
                        Built for product sellers, independent brands, and creators who want a store that sells — without the app sprawl.
                        <Link href="#faq" className={s.heroFaqLink}>Questions? See FAQ ↓</Link>
                    </p>
                    <p className={s.heroDiscovery}>
                        Not sure it&apos;s a fit? The discovery call is just a conversation — no commitment, no pitch.
                    </p>
                    <div className={s.heroStats}>
                        <div className={s.stat}>
                            <div className={s.statNum}>AI</div>
                            <div className={s.statLabel}>Builds your store</div>
                        </div>
                        <div className={s.stat}>
                            <div className={s.statNum}>0</div>
                            <div className={s.statLabel}>Apps to install</div>
                        </div>
                        <div className={s.stat}>
                            <div className={s.statNum}>Profit</div>
                            <div className={s.statLabel}>Analytics — not just revenue</div>
                        </div>
                        <div className={s.stat}>
                            <div className={s.statNum}>1 pipe</div>
                            <div className={s.statLabel}>Checkout → fulfillment</div>
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

            {/* ── Built-in, not app-store (Problem) ── */}
            <section className={s.sectionDark}>
                <div className={s.sectionGlow} />
                <div className={s.sectionGlow2} />
                <div className={s.wrap} style={{ position: "relative" }}>
                    <div className={s.noWarehouse}>
                        <div className={s.noWarehouseText}>
                            <p className={s.noWarehouseLabel}>Built-in, not app-store</p>
                            <h2 className={s.noWarehouseH3}>
                                Everything other platforms<br />
                                <span style={{ color: "#D3A73D" }}>charge extra for — included.</span>
                            </h2>
                            <p className={s.noWarehouseSub}>
                                Shopify and Wix sell you a shell, then make you assemble the real store from a dozen
                                paid apps — reviews, email, analytics, SEO — each with its own monthly fee.
                                Storefront Cloud builds those in. One platform, one bill, no app sprawl.
                            </p>
                            <p className={s.noWarehouseSub} style={{ marginTop: "-8px" }}>
                                And because it&apos;s part of the Pythias network, your store, your fulfillment, and your data
                                stay connected in one closed loop — something an app-store store can never match.
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
                        <h2 className={s.h2}>From an idea to a selling store — <span style={{ color: "#D3A73D" }}>in plain language.</span></h2>
                        <p className={s.sectionSub}>Three steps to launch a store that sells and fulfills itself.</p>
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
                        <h2 className={s.h2}>A complete commerce platform — out of the box.</h2>
                        <p className={s.sectionSub}>Every capability you&apos;d normally stitch together from paid apps, built in and AI-native.</p>
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
                        <h2 className={s.h2}>A store you build by describing it.</h2>
                        <p className={s.sectionSub}>From the AI builder to live analytics, Storefront Cloud gives you a beautiful, high-converting store without touching a single line of code.</p>
                    </div>
                    <ScreenshotGallery screenshots={[
                        { src: "https://images1.pythiastechnologies.com/screenshots/sf-ai-builder.png", title: "AI Site Builder",        sub: "Describe your store in plain language — the builder generates sections, copy, and real product photos, then lets you edit any section with AI." },
                        { src: "https://images1.pythiastechnologies.com/screenshots/sf-storefront.png",  title: "Your Live Storefront",   sub: "Pre-built themes, collections, fast faceted search, and a modern single-page checkout — all built to convert." },
                        { src: "https://images1.pythiastechnologies.com/screenshots/sf-analytics.png",   title: "Profit Analytics",       sub: "Live visitors, conversion funnel, and true profit — not just revenue — so you know exactly what's working." },
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
                            <h2 className={s.h2Light}>{walkthrough.title || "Watch how Storefront Cloud builds a store from a single prompt."}</h2>
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
                        <h2 className={s.h2Light}>One simple monthly rate — everything included.</h2>
                        <p className={s.sectionSubLight}>
                            No app store, no per-app fees. Every plan includes the AI builder, marketing, reviews, SEO,
                            and a direct pipe into the Pythias fulfillment network.
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
                                <meta itemProp="name" content={`Pythias Storefront Cloud — ${tier.name}`} />
                                {tier.price > 0 && <meta itemProp="price" content={tier.price} />}
                                <meta itemProp="priceCurrency" content="USD" />

                                <p className={s.tierName}>{tier.name}</p>
                                <div className={s.price}>
                                    <span className={s.priceSup}>$</span>
                                    {tier.price?.toLocaleString()}
                                </div>
                                <span className={s.pricePer}>/ month</span>

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

                    {/* Mobile app add-on */}
                    <div className={s.addon}>
                        <div className={s.addonText}>
                            <h3>📱 White-label native mobile apps</h3>
                            <p>
                                Add a branded iOS + Android app for your store — your name, your logo, in both app stores.
                                Pythias manages the Apple and Google accounts. Available as an add-on on any plan.
                            </p>
                        </div>
                        <div className={s.addonPrice}>
                            <div className={s.addonPriceVal}><span className={s.priceSup}>$</span>99</div>
                            <div className={s.addonPriceLabel}>/ month add-on</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Decision guide ── */}
            <section className={s.section}>
                <div className={s.wrapMd}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Part Of The Pythias Network</p>
                        <h2 className={s.h2}>Storefront, Fulfillment, and Commerce — one network.</h2>
                        <p className={s.sectionSub}>Storefront Cloud is your own direct-to-customer store. Pair it with the other two clouds, or run it on its own.</p>
                    </div>
                    <ul className={s.decideGrid} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li className={`${s.decideCard} ${s.decideCardCC}`}>
                            <span className={s.decideIcon}>🛍️</span>
                            <h3 className={s.decideTitle}>Storefront Cloud</h3>
                            <p className={s.decideSub}>Your own branded online store, AI-built, with checkout piping straight into fulfillment.</p>
                            <ul className={s.decideList}>
                                {[
                                    "You want your own direct-to-customer store and brand",
                                    "You want AI to build and edit the store for you",
                                    "You want marketing, reviews, SEO, and analytics built in",
                                    "You want checkout to fulfill itself — no integration glue",
                                ].map(item => (
                                    <li key={item} className={s.decideItem}>
                                        <span className={s.decideCheck} style={{ color: "#a5b4fc" }}>✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="https://platform.pythiastechnologies.com/register?type=storefront" className={s.decideBtnIndigo}>Start Storefront Cloud →</Link>
                        </li>
                        <li className={`${s.decideCard} ${s.decideCardFC}`}>
                            <span className={s.decideIcon}>🔗</span>
                            <h3 className={s.decideTitle}>Fulfillment & Commerce Cloud</h3>
                            <p className={s.decideSub}>Run a production operation, or sell across marketplaces with orders routed to fulfillment partners.</p>
                            <ul className={s.decideList}>
                                {[
                                    "Fulfillment Cloud — you own the production floor and equipment",
                                    "Commerce Cloud — sell on 18+ marketplaces, no equipment needed",
                                    "Both route orders through the Pythias fulfillment network",
                                    "All three clouds share data in one closed loop",
                                ].map(item => (
                                    <li key={item} className={s.decideItem}>
                                        <span className={s.decideCheck} style={{ color: "#D3A73D" }}>✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/commerce-cloud" className={s.decideBtnGold}>Explore the Other Clouds →</Link>
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
                    <h2 className={s.ctaTitle}>Ready to launch a store that sells itself?</h2>
                    <p className={s.ctaSub}>
                        Start a free trial — no credit card required. Describe your store and watch the AI build it in minutes.
                    </p>
                    <div className={s.btns}>
                        <Link href="https://platform.pythiastechnologies.com/register?type=storefront" className={s.ctaBtnGold}>
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
