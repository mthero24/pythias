import Link from "next/link";
import s from "./founding.module.css";
import FounderConversionTracker from "@/componants/FounderConversionTracker";

export const metadata = {
    title: "Pythias Founding Members — Join the First Cohort",
    description: "A limited first cohort of Pythias founding members. Free white-glove onboarding, 25% off for life on any plan, founding-member status, direct access to the founder, and a voice in the roadmap. Limited to the first 10.",
    alternates: { canonical: "https://pythiastechnologies.com/founding" },
    openGraph: {
        title: "Pythias Founding Members — Join the First Cohort",
        description: "Free white-glove onboarding, 25% off for life, and direct access to the founder. Limited to the first 10 founding members.",
        url: "https://pythiastechnologies.com/founding",
        type: "website",
    },
};

const PERKS = [
    {
        icon: "🤝",
        title: "Free white-glove onboarding",
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
];

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

const PATHS = [
    {
        icon: "🏭",
        name: "Fulfillment Cloud",
        cardClass: "pathCardFC",
        sub: "The production OS for print shops. Connect your printers, marketplaces, inventory, and team — orders flow in, your team sees exactly what to print, labels and tracking generate themselves.",
        priceVal: "from $199",
        pricePer: "/ mo",
        founding: "Founding members: 25% off, for life.",
        bullets: [
            "Production queues across every channel",
            "Automatic labels + tracking sync",
            "Inventory, team, and analytics in one OS",
        ],
        btnClass: "pathBtnGold",
        href: "https://platform.pythiastechnologies.com/register?type=fulfillment&founder=1",
    },
    {
        icon: "🛍️",
        name: "Commerce Cloud",
        cardClass: "pathCardCC",
        sub: "Sell anywhere, fulfill everywhere. List across 20+ marketplaces and 200+ channels — orders route automatically to vetted fulfillment partners. No warehouse, no equipment, no production staff.",
        priceVal: "free → $299",
        pricePer: "/ mo",
        founding: "Founding members: 25% off paid plans, for life.",
        bullets: [
            "20+ direct integrations · 200+ channels",
            "Intelligent automatic order routing",
            "Fee on margin — not your revenue",
        ],
        btnClass: "pathBtnIndigo",
        href: "https://platform.pythiastechnologies.com/register?type=commerce&founder=1",
    },
    {
        icon: "✨",
        name: "Storefront Cloud",
        cardClass: "pathCardSF",
        sub: "The AI-native online store builder. Describe your store and AI builds it — production, profit analytics, marketing, reviews, and SEO all built in. Checkout flows straight into Pythias fulfillment.",
        priceVal: "from $49",
        pricePer: "/ mo",
        founding: "Founding members: 25% off, for life.",
        bullets: [
            "AI builds and edits your store from plain language",
            "Single-page checkout into fulfillment",
            "Reviews, SEO, marketing — built in, not bolted on",
        ],
        btnClass: "pathBtnGreen",
        href: "https://platform.pythiastechnologies.com/register?type=storefront&founder=1",
    },
];

const FAQS = [
    {
        q: "What exactly is a founding member?",
        a: "Founding members are the first ten customers to commit to Pythias. In exchange for betting on us early, you get free white-glove onboarding, 25% off for life on whatever plan you run, your pricing locked forever, founding-member status, direct access to the founder, and a real voice in what we build next. All we ask in return is a short reference once you're live and honest feedback along the way.",
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
        q: "What does white-glove onboarding actually include?",
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
];

const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Pythias Founding Members",
    url: "https://pythiastechnologies.com/founding",
    description: "Join the first cohort of Pythias founding members — free white-glove onboarding, 25% off for life, founding-member status, and direct access to the founder. Limited to the first 10.",
};

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",             item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Founding Members", item: "https://pythiastechnologies.com/founding" },
    ],
};

export default function FoundingPage() {
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
                        <span className={s.heroBadgeDot} />
                        Limited to the first 10
                    </span>
                    <h1 className={s.h1}>
                        Pythias{" "}
                        <span className={s.accent}>Founding Members.</span>
                    </h1>
                    <p className={s.heroSub}>
                        Pythias is the picks-and-shovels operating system for product sellers —
                        sell on every channel, automate production and fulfillment, and build your own store, all in one platform.
                        We&apos;re opening a small first cohort to the people willing to build it with us. Free white-glove onboarding,
                        25% off for life, and a direct line to the founder.
                    </p>
                    <div className={s.heroBtns}>
                        <Link href="#paths" className={s.btnHeroGold}>
                            Become a founding member
                        </Link>
                        <Link href="#perks" className={s.btnHeroGhost}>
                            See what you get
                        </Link>
                    </div>
                    <p className={s.heroFor}>
                        Founder-to-founder. No hype — just an honest head start.
                        <Link href="#faq" className={s.heroFaqLink}>Questions? See FAQ ↓</Link>
                    </p>
                    <p className={s.heroDiscovery}>
                        Pick your plan on the next step — your 25% founding discount is applied for you.
                    </p>
                    <div className={s.heroStats}>
                        <div className={s.stat}>
                            <div className={s.statNum}>10</div>
                            <div className={s.statLabel}>Founding seats</div>
                        </div>
                        <div className={s.stat}>
                            <div className={s.statNum}>25%</div>
                            <div className={s.statLabel}>Off, for life</div>
                        </div>
                        <div className={s.stat}>
                            <div className={s.statNum}>$0</div>
                            <div className={s.statLabel}>Onboarding cost</div>
                        </div>
                        <div className={s.stat}>
                            <div className={s.statNum}>Locked</div>
                            <div className={s.statLabel}>Pricing forever</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── What you get ── */}
            <section id="perks" className={s.section}>
                <div className={s.wrap}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>What Founding Members Get</p>
                        <h2 className={s.h2}>A real head start — <span style={{ color: "#D3A73D" }}>not a launch discount.</span></h2>
                        <p className={s.sectionSub}>Six things you can only get by being one of the first ten. Once the cohort closes, this offer is gone.</p>
                    </div>
                    <ul className={s.perksGrid} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {PERKS.map((p) => (
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
                                We&apos;re not asking for a deposit or a long contract. We&apos;re asking the first ten people
                                to grow with us to do two simple things — so the next thousand sellers inherit a better platform
                                because you were here first.
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
                        <p className={s.sectionTag}>Choose Your Path</p>
                        <h2 className={s.h2Light}>Three ways to build on Pythias.</h2>
                        <p className={s.sectionSubLight}>
                            Pick the cloud that fits how you sell. You&apos;ll choose your exact tier on the next step —
                            your 25% founding discount is applied for you automatically.
                        </p>
                    </div>

                    {/* Founding discount banner */}
                    <div className={s.banner}>
                        <span className={s.bannerPct}>25% off</span>
                        <div>
                            <div className={s.bannerText}>Founding members take 25% off every plan, for life.</div>
                            <div className={s.bannerSub}>Prices below are standard rates — your founding discount is applied automatically at checkout.</div>
                        </div>
                    </div>

                    <ul className={s.pathGrid} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {PATHS.map((path) => (
                            <li key={path.name} className={`${s.pathCard} ${s[path.cardClass]}`}>
                                <span className={s.pathIcon}>{path.icon}</span>
                                <h3 className={s.pathName}>{path.name}</h3>
                                <p className={s.pathSub}>{path.sub}</p>
                                <div className={s.pathPrice}>
                                    <span className={s.pathPriceVal}>{path.priceVal}</span>
                                    <span className={s.pathPricePer}>{path.pricePer}</span>
                                </div>
                                <p className={s.pathFounding}>{path.founding}</p>
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
                                        Become a founding member →
                                    </Link>
                                    <p className={s.pathNote}>Pick your plan on the next step — your 25% founding discount is applied for you.</p>
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
                            <p className={s.stepDesc}>Pick your tier on the next step. We apply your 25%-off-for-life founding rate — no code to enter, and it&apos;s locked forever.</p>
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
                    <h2 className={s.ctaTitle}>Ten seats. Built with the first ten.</h2>
                    <p className={s.ctaSub}>
                        Free white-glove onboarding, 25% off for life, pricing locked forever, and a direct line to the founder.
                        Claim a founding seat before the cohort closes.
                    </p>
                    <div className={s.btns}>
                        <Link href="https://platform.pythiastechnologies.com/register?type=fulfillment&founder=1" className={s.ctaBtnGold}>
                            Become a founding member
                        </Link>
                        <Link href="#paths" className={s.ctaBtnGhost}>
                            Compare the three paths
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
