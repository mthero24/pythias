import Link from "next/link";
import s from "./testimonials.module.css";
import TestimonialsGrid from "./TestimonialsGrid";

export const metadata = {
    title: "Customer Testimonials — Pythias Technologies",
    description: "Hear from print shops and print-on-demand businesses that use Pythias Technologies to automate their operations, sync orders across 18+ marketplaces, and scale their production.",
    alternates: { canonical: "https://pythiastechnologies.com/testimonials" },
    openGraph: {
        title: "Customer Testimonials — Pythias Technologies",
        description: "Real results from real print shops. See how Pythias customers cut shipping times, automated production, and grew revenue.",
        url: "https://pythiastechnologies.com/testimonials",
    },
};

const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Pythias Technologies",
    "url": "https://pythiastechnologies.com",
};

export default function TestimonialsPage() {
    return (
        <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <div className={s.bg}>
            {/* Hero */}
            <section className={s.hero}>
                <div className={s.glow} />
                <div className={s.wrap}>
                    <p className={s.tag}>Customer Stories</p>
                    <h1 className={s.h1}>
                        Real results from<br />
                        <span className={s.accent}>real print shops.</span>
                    </h1>
                    <p className={s.sub}>
                        Hear directly from the businesses that use Pythias every day
                        to manage their production floors, sync marketplaces, and ship faster.
                    </p>
                </div>
            </section>

            {/* Stats bar */}
            <div className={s.statsBar}>
                <div className={s.wrap}>
                    <div className={s.statsGrid}>
                        <div className={s.stat}>
                            <p className={s.statGold}>18+</p>
                            <p className={s.statLabel}>Marketplace integrations</p>
                        </div>
                        <div className={s.stat}>
                            <p className={s.statGold}>200+</p>
                            <p className={s.statLabel}>Channels via Mirakl &amp; Acenda</p>
                        </div>
                        <div className={s.stat}>
                            <p className={s.statGold}>$0</p>
                            <p className={s.statLabel}>Per-order fees</p>
                        </div>
                        <div className={s.stat}>
                            <p className={s.statNum}>{"<"} 2 wks</p>
                            <p className={s.statLabel}>Typical onboarding</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video grid */}
            <section className={s.section}>
                <div className={s.wrap}>
                    <TestimonialsGrid />
                </div>
            </section>

            {/* CTA */}
            <section className={s.cta}>
                <div className={s.wrap}>
                    <h2 className={s.ctaTitle}>Ready to write your own success story?</h2>
                    <p className={s.ctaSub}>
                        Book a free 30-minute demo and see how Pythias can automate your print operation.
                    </p>
                    <div className={s.ctaBtns}>
                        <Link href="/#calendar-booking-section" className={s.ctaGold}>Book a Free Demo</Link>
                        <Link href="/pricing" className={s.ctaGhost}>See Pricing →</Link>
                    </div>
                </div>
            </section>
        </div>
        </>
    );
}
