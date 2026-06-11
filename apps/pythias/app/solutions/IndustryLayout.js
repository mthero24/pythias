import Link from "next/link";
import s from "./industry.module.css";

export default function IndustryLayout({ hero, pain, features, howItWorks, faqs }) {
    return (
        <div className={s.bg}>
            {/* Hero */}
            <section className={s.hero}>
                <div className={s.glow} />
                <div className={s.wrap}>
                    <span className={s.badge}>{hero.badge}</span>
                    <h1 className={s.h1}>{hero.h1}</h1>
                    <p className={s.sub}>{hero.sub}</p>
                    {hero.stats && (
                        <div className={s.statsRow}>
                            {hero.stats.map(stat => (
                                <div key={stat.label} className={s.stat}>
                                    <span className={s.statValue}>{stat.value}</span>
                                    <span className={s.statLabel}>{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className={s.heroBtns}>
                        <Link href="/#calendar-booking-section" className={s.btnGold}>Book a Free Demo</Link>
                        <Link href="/pricing" className={s.btnGhost}>See Pricing →</Link>
                    </div>
                </div>
            </section>

            {/* Pain section */}
            <section className={s.painSection}>
                <div className={s.wrap}>
                    <div className={s.sectionHead}>
                        <p className={s.sectionTag}>{pain.tag ?? "The Challenge"}</p>
                        <h2 className={s.h2}>{pain.title}</h2>
                        {pain.sub && <p className={s.sectionSub}>{pain.sub}</p>}
                    </div>
                    <div className={s.painGrid}>
                        {pain.items.map(item => (
                            <div key={item.title} className={s.painCard}>
                                <span className={s.painIcon}>{item.icon}</span>
                                <h3 className={s.painTitle}>{item.title}</h3>
                                <p className={s.painBody}>{item.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features section */}
            <section className={s.featureSection}>
                <div className={s.wrap}>
                    <div className={s.sectionHead}>
                        <p className={s.sectionTag}>{features.tag ?? "The Solution"}</p>
                        <h2 className={s.h2}>{features.title}</h2>
                        {features.sub && <p className={s.sectionSub}>{features.sub}</p>}
                    </div>
                    <div className={s.featureGrid}>
                        {features.items.map(item => (
                            <div key={item.title} className={s.featureCard}>
                                <span className={s.featureIcon}>{item.icon}</span>
                                <h3 className={s.featureTitle}>{item.title}</h3>
                                <p className={s.featureBody}>{item.body}</p>
                                {item.bullets && (
                                    <ul className={s.featureBullets}>
                                        {item.bullets.map(b => (
                                            <li key={b} className={s.featureBullet}>
                                                <span className={s.bulletCheck}>✓</span>{b}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className={s.stepsSection}>
                <div className={s.wrap}>
                    <div className={s.sectionHead}>
                        <p className={s.sectionTag}>How It Works</p>
                        <h2 className={s.h2}>{howItWorks.title ?? "Up and running in under 2 weeks"}</h2>
                        {howItWorks.sub && <p className={s.sectionSub}>{howItWorks.sub}</p>}
                    </div>
                    <div className={s.stepsGrid}>
                        {howItWorks.steps.map((step, i) => (
                            <div key={step.title} className={s.stepCard}>
                                <span className={s.stepNum}>0{i + 1}</span>
                                <h3 className={s.stepTitle}>{step.title}</h3>
                                <p className={s.stepBody}>{step.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className={s.faqSection}>
                <div className={s.wrap}>
                    <div className={s.sectionHead}>
                        <h2 className={s.h2}>Frequently asked questions</h2>
                    </div>
                    <div className={s.faqList}>
                        {faqs.map(f => (
                            <div key={f.q} className={s.faqItem}>
                                <p className={s.faqQ}>{f.q}</p>
                                <p className={s.faqA}>{f.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={s.cta}>
                <div className={s.wrap}>
                    <h2 className={s.ctaTitle}>See Pythias in action</h2>
                    <p className={s.ctaSub}>Book a free 30-minute demo and we&apos;ll walk through your exact workflow.</p>
                    <div className={s.ctaBtns}>
                        <Link href="/#calendar-booking-section" className={s.ctaGold}>Book a Free Demo</Link>
                        <Link href="/pricing" className={s.ctaGhost}>See Pricing →</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
