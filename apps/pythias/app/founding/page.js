import Link from "next/link";
import s from "./founding.module.css";
import FounderConversionTracker from "@/componants/FounderConversionTracker";
import FoundingInterestCapture from "@/componants/FoundingInterestCapture";
import { FounderOrg } from "@/models/Org";

export const dynamic = "force-dynamic";

const FOUNDER_SLOTS = 10;
const EARLY_SLOTS = 50; // early-bird covers slots 11–60
const TEN_SLOTS = 40;   // early-adopter (10% off/yr only) covers slots 61–100

export const metadata = {
    title: "Pythias Founding Members — Join the First Cohort",
    description: "A limited first cohort of Pythias founding members. Free remote onboarding, 25% off for life on any plan, founding-member status, direct access to the founder, and a voice in the roadmap. Limited to the first 10.",
    alternates: { canonical: "https://pythiastechnologies.com/founding" },
    openGraph: {
        title: "Pythias Founding Members — Join the First Cohort",
        description: "Free remote onboarding, 25% off for life, and direct access to the founder. Limited to the first 10 founding members.",
        url: "https://pythiastechnologies.com/founding",
        type: "website",
    },
};

// ── Tier configs ──────────────────────────────────────────────────────────
// One config object is chosen by tier (see buildOffer) and threaded through
// every place the page hardcodes the offer. The product-path base URLs stay
// fixed; only the per-tier flag suffix changes.
function buildOffer(filled) {
    const founderTier = {
        tier: "founder",
        flag: "&founder=1&offer=founder",
        // Hero
        heroBadge: `${Math.max(FOUNDER_SLOTS - filled, 0)} of 10 left`,
        heroBadgeDot: true,
        heroAccent: "Founding Members.",
        heroSub: (
            <>
                Pythias is the picks-and-shovels operating system for product sellers —
                sell on every channel, automate production and fulfillment, and build your own store, all in one platform.
                We&apos;re opening a small first cohort to the people willing to build it with us. Free remote onboarding,
                25% off for life, and a direct line to the founder.
            </>
        ),
        heroBtnPrimary: "Become a founding member",
        heroFor: "Founder-to-founder. No hype — just an honest head start.",
        heroDiscovery: "Pick your plan on the next step — your 25% founding discount is applied for you.",
        stats: [
            { num: "10", label: "Founding seats" },
            { num: "25%", label: "Off, for life" },
            { num: "$0", label: "Onboarding cost" },
            { num: "Locked", label: "Pricing forever" },
        ],
        // Perks
        perksTag: "What Founding Members Get",
        perksH2Accent: "not a launch discount.",
        perksSub: "Six things you can only get by being one of the first ten. Once the cohort closes, this offer is gone.",
        perks: [
            {
                icon: "🤝",
                title: "Free remote onboarding",
                desc: "We personally set you up. Channels connected, products built, fulfillment wired, team trained — done with you, not handed to you in a help doc.",
            },
            {
                icon: "🏷️",
                title: "25% off for life",
                desc: "A quarter off whatever plan you run, on every invoice, for as long as you're a customer. Applied automatically — you never re-enter a code.",
            },
            {
                icon: "🔒",
                title: "Pricing locked forever",
                desc: "Your founding rate never goes up. As plans evolve and prices rise for everyone else, your number stays exactly where it started.",
            },
            {
                icon: "📞",
                title: "Direct access to the founder",
                desc: "A real line to the person building the platform — not a ticket queue. Ask anything, escalate anything, get answers from the source.",
            },
            {
                icon: "🧭",
                title: "Help shape the roadmap",
                desc: "Founding members get a seat at the table. The features you need move up the list, because you're the people we're building this for first.",
            },
            {
                icon: "⭐",
                title: "Founding-member status",
                desc: "Permanent recognition as one of the first ten to bet on Pythias — a standing that can't be bought once the cohort closes.",
            },
        ],
        // Ask
        askSub: (
            <>
                We&apos;re not asking for a deposit or a long contract. We&apos;re asking the first ten people
                to grow with us to do two simple things — so the next thousand sellers inherit a better platform
                because you were here first.
            </>
        ),
        // Paths
        pathsTag: "Choose Your Path",
        pathsSubLight: (
            <>
                Pick the cloud that fits how you sell. You&apos;ll choose your exact tier on the next step —
                your 25% founding discount is applied for you automatically.
            </>
        ),
        showBanner: true,
        bannerPct: "25% off",
        bannerText: "Founding members take 25% off every plan, for life.",
        bannerSub: "Prices below are standard rates — your founding discount is applied automatically at checkout.",
        pathFounding: {
            fulfillment: "Founding members: 25% off, for life.",
            commerce: "Founding members: 25% off paid plans, for life.",
            storefront: "Founding members: 25% off, for life.",
        },
        pathBtn: "Become a founding member →",
        pathNote: "Pick your plan on the next step — your 25% founding discount is applied for you.",
        // How it works
        step2Desc: "Pick your tier on the next step. We apply your 25%-off-for-life founding rate — no code to enter, and it's locked forever.",
        // FAQ
        faqs: [
            {
                q: "What exactly is a founding member?",
                a: "Founding members are the first ten customers to commit to Pythias. In exchange for betting on us early, you get free remote onboarding, 25% off for life on whatever plan you run, your pricing locked forever, founding-member status, direct access to the founder, and a real voice in what we build next. All we ask in return is a short reference once you're live and honest feedback along the way.",
            },
            {
                q: "How is the 25% discount applied? Do I enter a code?",
                a: "No code to remember. When you register from this page, your account is automatically flagged as a founding member. After you pick your plan, the 25%-off-for-life discount is applied for you — so every invoice already reflects your founding rate.",
            },
            {
                q: "Which plan do I pick?",
                a: "You choose your tier on the register page — and you can change it later. Pick the product path that fits how you sell: Fulfillment Cloud if you run your own production floor, Commerce Cloud if you want to sell without owning production, or Storefront Cloud if you want an AI-built online store that flows straight into fulfillment. Whatever you choose, the founding discount applies.",
            },
            {
                q: "What does remote onboarding actually include?",
                a: "We set you up personally. That means connecting your sales channels, building out your product catalog, wiring up fulfillment, and training your team — done with you on a call, not left to a help doc. The goal is to get you live and selling without the usual setup grind.",
            },
            {
                q: "Is the founding rate really locked forever?",
                a: "Yes. Your founding price never increases. As we add features and raise prices for new customers, your number stays exactly where it started — for as long as you remain a customer.",
            },
            {
                q: "How limited is this?",
                a: "We're capping the founding cohort at the first ten members. Once those ten seats are filled, the offer closes and founding-member status can't be bought after that.",
            },
            {
                q: "What's the catch on the reference?",
                a: "There isn't one. Once you're live and seeing results, we'll ask for a short case study or reference in your own words, on your own timeline. If your experience isn't worth talking about, we haven't done our job — so the incentive is entirely on us to make it great.",
            },
        ],
        // Final CTA
        ctaTitle: "Ten seats. Built with the first ten.",
        ctaSub: (
            <>
                Free remote onboarding, 25% off for life, pricing locked forever, and a direct line to the founder.
                Claim a founding seat before the cohort closes.
            </>
        ),
        ctaBtnPrimary: "Become a founding member",
    };

    const earlyTier = {
        tier: "early",
        flag: "&founder=1&offer=early",
        heroBadge: `${Math.max(FOUNDER_SLOTS + EARLY_SLOTS - filled, 0)} of 50 left`,
        heroBadgeDot: true,
        heroAccent: "Early-Bird Members.",
        heroSub: (
            <>
                Pythias is the picks-and-shovels operating system for product sellers —
                sell on every channel, automate production and fulfillment, and build your own store, all in one platform.
                The founding cohort is full — but the early-bird cohort is open to the next sellers willing to build it with us.
                50% off remote onboarding, 20% off for a year, and a direct line to the founder.
            </>
        ),
        heroBtnPrimary: "Become an early-bird member",
        heroFor: "Founder-to-founder. No hype — just an honest head start.",
        heroDiscovery: "Pick your plan on the next step — your 20% early-bird discount is applied for you.",
        stats: [
            { num: "50", label: "Early-bird seats" },
            { num: "20%", label: "Off, for a year" },
            { num: "50%", label: "Off onboarding" },
            { num: "Direct", label: "Founder access" },
        ],
        perksTag: "What Early-Bird Members Get",
        perksH2Accent: "not a launch discount.",
        perksSub: "Things you can only get by being one of the next fifty. Once the cohort closes, this offer is gone.",
        perks: [
            {
                icon: "🤝",
                title: "50% off remote onboarding",
                desc: "We personally set you up. Channels connected, products built, fulfillment wired, team trained — done with you, not handed to you in a help doc.",
            },
            {
                icon: "🏷️",
                title: "20% off for a year",
                desc: "A fifth off whatever plan you run, on every invoice, for your first year as a customer. Applied automatically — you never re-enter a code.",
            },
            {
                icon: "📞",
                title: "Direct access to the founder",
                desc: "A real line to the person building the platform — not a ticket queue. Ask anything, escalate anything, get answers from the source.",
            },
            {
                icon: "🧭",
                title: "Help shape the roadmap",
                desc: "Early-bird members get a seat at the table. The features you need move up the list, because you're the people we're building this for first.",
            },
            {
                icon: "⭐",
                title: "Early-bird-member status",
                desc: "Permanent recognition as one of the next fifty to bet on Pythias — a standing that can't be bought once the cohort closes.",
            },
        ],
        askSub: (
            <>
                We&apos;re not asking for a deposit or a long contract. We&apos;re asking the next fifty people
                to grow with us to do two simple things — so the next thousand sellers inherit a better platform
                because you were here early.
            </>
        ),
        pathsTag: "Choose Your Path",
        pathsSubLight: (
            <>
                Pick the cloud that fits how you sell. You&apos;ll choose your exact tier on the next step —
                your 20% early-bird discount is applied for you automatically.
            </>
        ),
        showBanner: true,
        bannerPct: "20% off",
        bannerText: "Early-bird members take 20% off every plan, for a year.",
        bannerSub: "Prices below are standard rates — your early-bird discount is applied automatically at checkout.",
        pathFounding: {
            fulfillment: "Early-bird members: 20% off, for a year.",
            commerce: "Early-bird members: 20% off paid plans, for a year.",
            storefront: "Early-bird members: 20% off, for a year.",
        },
        pathBtn: "Become an early-bird member →",
        pathNote: "Pick your plan on the next step — your 20% early-bird discount is applied for you.",
        step2Desc: "Pick your tier on the next step. We apply your 20%-off-for-a-year early-bird rate — no code to enter.",
        faqs: [
            {
                q: "What exactly is an early-bird member?",
                a: "Early-bird members are the next fifty customers to commit to Pythias after the founding cohort. In exchange for betting on us early, you get 50% off remote onboarding, 20% off for a year on whatever plan you run, early-bird-member status, direct access to the founder, and a real voice in what we build next. All we ask in return is a short reference once you're live and honest feedback along the way.",
            },
            {
                q: "How is the 20% discount applied? Do I enter a code?",
                a: "No code to remember. When you register from this page, your account is automatically flagged as an early-bird member. After you pick your plan, the 20%-off-for-a-year discount is applied for you — so every invoice in your first year already reflects your early-bird rate.",
            },
            {
                q: "Which plan do I pick?",
                a: "You choose your tier on the register page — and you can change it later. Pick the product path that fits how you sell: Fulfillment Cloud if you run your own production floor, Commerce Cloud if you want to sell without owning production, or Storefront Cloud if you want an AI-built online store that flows straight into fulfillment. Whatever you choose, the early-bird discount applies.",
            },
            {
                q: "What does remote onboarding actually include?",
                a: "We set you up personally. That means connecting your sales channels, building out your product catalog, wiring up fulfillment, and training your team — done with you on a call, not left to a help doc. The goal is to get you live and selling without the usual setup grind.",
            },
            {
                q: "How long does the early-bird rate last?",
                a: "Your early-bird rate applies for your first year as a customer. After that, your plan moves to standard pricing — but the head start and founder access you got along the way are yours to keep.",
            },
            {
                q: "How limited is this?",
                a: "We're capping the early-bird cohort at fifty members. Once those fifty seats are filled, the offer closes and early-bird-member status can't be bought after that.",
            },
            {
                q: "What's the catch on the reference?",
                a: "There isn't one. Once you're live and seeing results, we'll ask for a short case study or reference in your own words, on your own timeline. If your experience isn't worth talking about, we haven't done our job — so the incentive is entirely on us to make it great.",
            },
        ],
        ctaTitle: "Fifty seats. Built with the early ones.",
        ctaSub: (
            <>
                50% off remote onboarding, 20% off for a year, and a direct line to the founder.
                Claim an early-bird seat before the cohort closes.
            </>
        ),
        ctaBtnPrimary: "Become an early-bird member",
    };

    const tenTier = {
        tier: "ten",
        flag: "&founder=1&offer=ten",
        heroBadge: `${Math.max(FOUNDER_SLOTS + EARLY_SLOTS + TEN_SLOTS - filled, 0)} of 40 left`,
        heroBadgeDot: true,
        heroAccent: "Early Adopters.",
        heroSub: (
            <>
                Pythias is the picks-and-shovels operating system for product sellers —
                sell on every channel, automate production and fulfillment, and build your own store, all in one platform.
                The founding and early-bird cohorts are full — but there&apos;s still a head start for the next forty sellers:
                10% off for a year, and a direct line to the founder.
            </>
        ),
        heroBtnPrimary: "Become an early adopter",
        heroFor: "Founder-to-founder. No hype — just an honest head start.",
        heroDiscovery: "Pick your plan on the next step — your 10% early-adopter discount is applied for you.",
        stats: [
            { num: "40", label: "Early-adopter seats" },
            { num: "10%", label: "Off, for a year" },
            { num: "Direct", label: "Founder access" },
            { num: "1", label: "Platform" },
        ],
        perksTag: "What Early Adopters Get",
        perksH2Accent: "not a launch discount.",
        perksSub: "Things you can only get by being one of the next forty. Once the cohort closes, this offer is gone.",
        perks: [
            {
                icon: "🏷️",
                title: "10% off for a year",
                desc: "Ten percent off whatever plan you run, on every invoice, for your first year as a customer. Applied automatically — you never re-enter a code.",
            },
            {
                icon: "📞",
                title: "Direct access to the founder",
                desc: "A real line to the person building the platform — not a ticket queue. Ask anything, escalate anything, get answers from the source.",
            },
            {
                icon: "🧭",
                title: "Help shape the roadmap",
                desc: "Early adopters get a seat at the table. The features you need move up the list, because you're the people we're building this for first.",
            },
            {
                icon: "⭐",
                title: "Early-adopter status",
                desc: "Permanent recognition as one of the next forty to bet on Pythias — a standing that can't be bought once the cohort closes.",
            },
        ],
        askSub: (
            <>
                We&apos;re not asking for a deposit or a long contract. We&apos;re asking the next forty people
                to grow with us to do two simple things — so the next thousand sellers inherit a better platform
                because you were here early.
            </>
        ),
        pathsTag: "Choose Your Path",
        pathsSubLight: (
            <>
                Pick the cloud that fits how you sell. You&apos;ll choose your exact tier on the next step —
                your 10% early-adopter discount is applied for you automatically.
            </>
        ),
        showBanner: true,
        bannerPct: "10% off",
        bannerText: "Early adopters take 10% off every plan, for a year.",
        bannerSub: "Prices below are standard rates — your early-adopter discount is applied automatically at checkout.",
        pathFounding: {
            fulfillment: "Early adopters: 10% off, for a year.",
            commerce: "Early adopters: 10% off paid plans, for a year.",
            storefront: "Early adopters: 10% off, for a year.",
        },
        pathBtn: "Become an early adopter →",
        pathNote: "Pick your plan on the next step — your 10% early-adopter discount is applied for you.",
        step2Desc: "Pick your tier on the next step. We apply your 10%-off-for-a-year early-adopter rate — no code to enter.",
        faqs: [
            {
                q: "What exactly is an early adopter?",
                a: "Early adopters are the next forty customers to commit to Pythias after the founding and early-bird cohorts. In exchange for betting on us early, you get 10% off for a year on whatever plan you run, early-adopter status, direct access to the founder, and a real voice in what we build next. All we ask in return is a short reference once you're live and honest feedback along the way.",
            },
            {
                q: "How is the 10% discount applied? Do I enter a code?",
                a: "No code to remember. When you register from this page, your account is automatically flagged as an early adopter. After you pick your plan, the 10%-off-for-a-year discount is applied for you — so every invoice in your first year already reflects your rate.",
            },
            {
                q: "Which plan do I pick?",
                a: "You choose your tier on the register page — and you can change it later. Pick the product path that fits how you sell: Fulfillment Cloud if you run your own production floor, Commerce Cloud if you want to sell without owning production, or Storefront Cloud if you want an AI-built online store that flows straight into fulfillment. Whatever you choose, the early-adopter discount applies.",
            },
            {
                q: "How long does the early-adopter rate last?",
                a: "Your early-adopter rate applies for your first year as a customer. After that, your plan moves to standard pricing — but the head start and founder access you got along the way are yours to keep.",
            },
            {
                q: "How limited is this?",
                a: "We're capping the early-adopter cohort at forty members. Once those forty seats are filled, the offer closes for good.",
            },
            {
                q: "What's the catch on the reference?",
                a: "There isn't one. Once you're live and seeing results, we'll ask for a short case study or reference in your own words, on your own timeline. If your experience isn't worth talking about, we haven't done our job — so the incentive is entirely on us to make it great.",
            },
        ],
        ctaTitle: "Forty seats. A real head start.",
        ctaSub: (
            <>
                10% off for a year and a direct line to the founder. Claim an early-adopter seat before the cohort closes.
            </>
        ),
        ctaBtnPrimary: "Become an early adopter",
    };

    const closedTier = {
        tier: "closed",
        flag: "", // no founder flag — standard register
        heroBadge: "Both cohorts are full",
        heroBadgeDot: false,
        heroAccent: "Welcome to Pythias.",
        heroSub: (
            <>
                Pythias is the picks-and-shovels operating system for product sellers —
                sell on every channel, automate production and fulfillment, and build your own store, all in one platform.
                Our founding and early-bird cohorts are full — but you can still start today on standard pricing
                and get the same platform the first sellers built on.
            </>
        ),
        heroBtnPrimary: "Get started",
        heroFor: "Founder-to-founder. No hype — just an honest head start.",
        heroDiscovery: "Pick your plan on the next step and start selling.",
        stats: [
            { num: "20+", label: "Marketplaces" },
            { num: "200+", label: "Channels" },
            { num: "3", label: "Product clouds" },
            { num: "1", label: "Platform" },
        ],
        perksTag: "What You Get",
        perksH2Accent: "one platform to run it all.",
        perksSub: "The founding and early-bird cohorts have closed — but the platform they helped build is here for you, on standard pricing.",
        perks: [
            {
                icon: "🤝",
                title: "Hands-on onboarding",
                desc: "We help you get set up. Channels connected, products built, fulfillment wired, team trained — done with you, not handed to you in a help doc.",
            },
            {
                icon: "📞",
                title: "Direct access to the founder",
                desc: "A real line to the person building the platform — not a ticket queue. Ask anything, escalate anything, get answers from the source.",
            },
            {
                icon: "🧭",
                title: "Help shape the roadmap",
                desc: "Customer feedback drives what we build. The features you need move up the list, because you're the people we're building this for.",
            },
        ],
        askSub: (
            <>
                We&apos;re not asking for a deposit or a long contract. We&apos;re asking the sellers who grow with us
                to do two simple things — so the next thousand sellers inherit a better platform because you were here.
            </>
        ),
        pathsTag: "Choose Your Path",
        pathsSubLight: (
            <>
                Pick the cloud that fits how you sell. You&apos;ll choose your exact tier on the next step.
            </>
        ),
        showBanner: false,
        bannerPct: "",
        bannerText: "",
        bannerSub: "",
        pathFounding: {
            fulfillment: "",
            commerce: "",
            storefront: "",
        },
        pathBtn: "Get started →",
        pathNote: "Pick your plan on the next step and start selling.",
        step2Desc: "Pick your tier on the next step. Choose the plan that fits how you sell — you can change it later.",
        faqs: [
            {
                q: "Are the founding and early-bird offers still available?",
                a: "Both cohorts are full. The founding cohort capped at the first ten members and the early-bird cohort at the next fifty — those seats are taken. You can still start on Pythias today on standard pricing and get the same platform they built on.",
            },
            {
                q: "Which plan do I pick?",
                a: "You choose your tier on the register page — and you can change it later. Pick the product path that fits how you sell: Fulfillment Cloud if you run your own production floor, Commerce Cloud if you want to sell without owning production, or Storefront Cloud if you want an AI-built online store that flows straight into fulfillment.",
            },
            {
                q: "What does onboarding include?",
                a: "We help you get set up. That means connecting your sales channels, building out your product catalog, wiring up fulfillment, and training your team. The goal is to get you live and selling without the usual setup grind.",
            },
            {
                q: "Will there be another founding-style offer?",
                a: "The founding and early-bird cohorts were one-time, limited offers tied to the earliest sellers. We can't promise another — but starting now still gets you the full platform and a direct line to the team building it.",
            },
        ],
        ctaTitle: "Start selling on Pythias.",
        ctaSub: (
            <>
                The founding and early-bird cohorts are full — but the platform is open. Start today on standard pricing
                and get the same operating system the first sellers built on.
            </>
        ),
        ctaBtnPrimary: "Get started",
    };

    if (filled < FOUNDER_SLOTS) return founderTier;
    if (filled < FOUNDER_SLOTS + EARLY_SLOTS) return earlyTier;
    if (filled < FOUNDER_SLOTS + EARLY_SLOTS + TEN_SLOTS) return tenTier;
    return closedTier;
}

const ASK = [
    { icon: "📝", text: "A short reference or case study once you're live and seeing results — in your own words, on your own timeline." },
    { icon: "💬", text: "Honest feedback — the good, the rough, and the missing. You tell us what works, and we fix what doesn't." },
];

const PROOF = [
    {
        stat: "~$1M → ~$10M",
        text: "We helped one seller scale from roughly $1M to roughly $10M in annual sales — by giving them the operating system to sell on every channel and fulfill it all in one place.",
        tag: "Multi-channel growth",
    },
    {
        stat: "~60% more throughput",
        text: "A print-fulfillment partner saw roughly 60% higher production throughput and a perfect on-time record across every marketplace — same team, same floor, far more shipped.",
        tag: "Production & fulfillment",
    },
];

// Fixed product-path base data; CTA href = base + per-tier flag suffix.
const PATH_BASE = [
    {
        icon: "🏭",
        name: "Fulfillment Cloud",
        cardClass: "pathCardFC",
        key: "fulfillment",
        sub: "The production OS for print shops. Connect your printers, marketplaces, inventory, and team — orders flow in, your team sees exactly what to print, labels and tracking generate themselves.",
        priceVal: "from $199",
        pricePer: "/ mo",
        bullets: [
            "Production queues across every channel",
            "Automatic labels + tracking sync",
            "Inventory, team, and analytics in one OS",
        ],
        btnClass: "pathBtnGold",
        baseHref: "https://platform.pythiastechnologies.com/register?type=fulfillment",
    },
    {
        icon: "✨",
        name: "Storefront Cloud",
        cardClass: "pathCardSF",
        key: "storefront",
        sub: "The AI-native online store builder. Describe your store and AI builds it — production, profit analytics, marketing, reviews, and SEO all built in. Checkout flows straight into Pythias fulfillment.",
        priceVal: "from $49",
        pricePer: "/ mo",
        bullets: [
            "AI builds and edits your store from plain language",
            "Single-page checkout into fulfillment",
            "Reviews, SEO, marketing — built in, not bolted on",
        ],
        btnClass: "pathBtnGreen",
        baseHref: "https://platform.pythiastechnologies.com/register?type=storefront",
    },
];

const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Pythias Founding Members",
    url: "https://pythiastechnologies.com/founding",
    description: "Join the first cohort of Pythias founding members — free remote onboarding, 25% off for life, founding-member status, and direct access to the founder. Limited to the first 10.",
};

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",             item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Founding Members", item: "https://pythiastechnologies.com/founding" },
    ],
};

export default async function FoundingPage() {
    let filled = 0;
    try {
        filled = await FounderOrg.countDocuments({ founder: true });
    } catch {
        filled = 0;
    }

    const offer = buildOffer(filled);
    const paths = PATH_BASE.map((p) => ({
        ...p,
        founding: offer.pathFounding[p.key],
        href: `${p.baseHref}${offer.flag}`,
    }));
    const finalCtaHref = `${PATH_BASE[0].baseHref}${offer.flag}`;

    return (
        <div className={s.bg}>
            <FounderConversionTracker />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            {/* ── Hero ── */}
            <section className={s.hero}>
                <div className={`${s.glow} ${s.glow1}`} />
                <div className={`${s.glow} ${s.glow2}`} />
                <div className={s.wrap}>
                    <span className={s.heroBadge}>
                        {offer.heroBadgeDot && <span className={s.heroBadgeDot} />}
                        {offer.heroBadge}
                    </span>
                    <h1 className={s.h1}>
                        Pythias{" "}
                        <span className={s.accent}>{offer.heroAccent}</span>
                    </h1>
                    <p className={s.heroSub}>
                        {offer.heroSub}
                    </p>
                    <div className={s.heroBtns}>
                        <Link href="#paths" className={s.btnHeroGold}>
                            {offer.heroBtnPrimary}
                        </Link>
                        <Link href="#perks" className={s.btnHeroGhost}>
                            See what you get
                        </Link>
                    </div>
                    <p className={s.heroFor}>
                        {offer.heroFor}
                        <Link href="#faq" className={s.heroFaqLink}>Questions? See FAQ ↓</Link>
                    </p>
                    <p className={s.heroDiscovery}>
                        {offer.heroDiscovery}
                    </p>
                    <div className={s.heroStats}>
                        {offer.stats.map((st) => (
                            <div key={st.label} className={s.stat}>
                                <div className={s.statNum}>{st.num}</div>
                                <div className={s.statLabel}>{st.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── What you get ── */}
            <section id="perks" className={s.section}>
                <div className={s.wrap}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>{offer.perksTag}</p>
                        <h2 className={s.h2}>A real head start — <span style={{ color: "#D3A73D" }}>{offer.perksH2Accent}</span></h2>
                        <p className={s.sectionSub}>{offer.perksSub}</p>
                    </div>
                    <ul className={s.perksGrid} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {offer.perks.map((p) => (
                            <li key={p.title} className={s.perkCard}>
                                <span className={s.perkIcon}>{p.icon}</span>
                                <h3 className={s.perkTitle}>{p.title}</h3>
                                <p className={s.perkDesc}>{p.desc}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ── What we ask in return ── */}
            <section className={s.sectionDark}>
                <div className={s.sectionGlow} />
                <div className={s.sectionGlow2} />
                <div className={s.wrap} style={{ position: "relative" }}>
                    <div className={s.ask}>
                        <div className={s.askText}>
                            <p className={s.askLabel}>A fair trade</p>
                            <h2 className={s.askH3}>
                                All we ask in return<br />
                                <span style={{ color: "#D3A73D" }}>is the truth.</span>
                            </h2>
                            <p className={s.askSub}>
                                {offer.askSub}
                            </p>
                            <p className={s.askSub} style={{ marginTop: "-8px" }}>
                                That&apos;s the whole deal. We do the work to make you successful; you tell the world (and tell us
                                where we fell short).
                            </p>
                        </div>
                        <div className={s.askVisual}>
                            <p className={s.askVisualLabel}>What we ask of you</p>
                            <ul className={s.askList}>
                                {ASK.map((item) => (
                                    <li key={item.text} className={s.askItem}>
                                        <span className={s.askBadge}>✓</span>
                                        <span className={s.askItemText}>{item.icon} {item.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Proof points ── */}
            <section className={s.section}>
                <div className={s.wrap}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Why It Works</p>
                        <h2 className={s.h2}>The operating system behind real growth.</h2>
                        <p className={s.sectionSub}>
                            One platform to sell on every channel, automate production and fulfillment, and run your own store —
                            so your effort goes into the business, not the busywork. Here&apos;s what that looks like in practice.
                        </p>
                    </div>
                    <ul className={s.proofGrid} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {PROOF.map((p) => (
                            <li key={p.tag} className={s.proofCard}>
                                <div className={s.proofStat}><span className={s.accentInline}>{p.stat}</span></div>
                                <p className={s.proofText}>{p.text}</p>
                                <p className={s.proofTag}>{p.tag}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ── Product paths ── */}
            <section id="paths" className={s.sectionDark}>
                <div className={s.sectionGlow} />
                <div className={s.wrap} style={{ position: "relative" }}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>{offer.pathsTag}</p>
                        <h2 className={s.h2Light}>Three ways to build on Pythias.</h2>
                        <p className={s.sectionSubLight}>
                            {offer.pathsSubLight}
                        </p>
                    </div>

                    {/* Discount banner */}
                    {offer.showBanner && (
                        <div className={s.banner}>
                            <span className={s.bannerPct}>{offer.bannerPct}</span>
                            <div>
                                <div className={s.bannerText}>{offer.bannerText}</div>
                                <div className={s.bannerSub}>{offer.bannerSub}</div>
                            </div>
                        </div>
                    )}

                    <ul className={s.pathGrid} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {paths.map((path) => (
                            <li key={path.name} className={`${s.pathCard} ${s[path.cardClass]}`}>
                                <span className={s.pathIcon}>{path.icon}</span>
                                <h3 className={s.pathName}>{path.name}</h3>
                                <p className={s.pathSub}>{path.sub}</p>
                                <div className={s.pathPrice}>
                                    <span className={s.pathPriceVal}>{path.priceVal}</span>
                                    <span className={s.pathPricePer}>{path.pricePer}</span>
                                </div>
                                {path.founding && <p className={s.pathFounding}>{path.founding}</p>}
                                <ul className={s.pathList}>
                                    {path.bullets.map((b) => (
                                        <li key={b} className={s.pathItem}>
                                            <span className={s.pathCheck} style={{ color: "#D3A73D" }}>✓</span>
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                                <div className={s.pathFooter}>
                                    <Link href={path.href} className={s[path.btnClass]}>
                                        {offer.pathBtn}
                                    </Link>
                                    <p className={s.pathNote}>{offer.pathNote}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ── How it works ── */}
            <section className={s.section}>
                <div className={s.wrap}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>How It Works</p>
                        <h2 className={s.h2}>From this page to founding member — <span style={{ color: "#D3A73D" }}>in three steps.</span></h2>
                        <p className={s.sectionSub}>No long form, no sales gauntlet. Claim a seat and we take it from there.</p>
                    </div>
                    <ul className={s.steps} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li className={s.step}>
                            <div className={s.stepNum}>1</div>
                            <span className={s.stepIcon}>🚀</span>
                            <h3 className={s.stepTitle}>Pick your path &amp; register</h3>
                            <p className={s.stepDesc}>Choose Fulfillment, Commerce, or Storefront Cloud and register. Your account is flagged as a founding member automatically.</p>
                        </li>
                        <li className={s.step}>
                            <div className={s.stepNum}>2</div>
                            <span className={s.stepIcon}>🏷️</span>
                            <h3 className={s.stepTitle}>Your discount is applied</h3>
                            <p className={s.stepDesc}>{offer.step2Desc}</p>
                        </li>
                        <li className={s.step}>
                            <div className={s.stepNum}>3</div>
                            <span className={s.stepIcon}>🤝</span>
                            <h3 className={s.stepTitle}>We set you up, hands-on</h3>
                            <p className={s.stepDesc}>White-glove onboarding gets you live — channels connected, products built, team trained. Then you&apos;re selling.</p>
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
                        {offer.faqs.map((faq) => (
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
                    <h2 className={s.ctaTitle}>{offer.ctaTitle}</h2>
                    <p className={s.ctaSub}>
                        {offer.ctaSub}
                    </p>
                    <div className={s.btns}>
                        <Link href={finalCtaHref} className={s.ctaBtnGold}>
                            {offer.ctaBtnPrimary}
                        </Link>
                        <Link href="#paths" className={s.ctaBtnGhost}>
                            Compare the three paths
                        </Link>
                    </div>
                    <FoundingInterestCapture />
                </div>
            </section>
        </div>
    );
}
