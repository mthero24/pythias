import Image from "next/image";
import Logo from "../../public/logo_vertical.png";
import s from "./home.module.css";

const STATS = [
    { value: "18",      label: "Marketplace Integrations" },
    { value: "200+",    label: "Channels via Mirakl & Acenda" },
    { value: "24/7",    label: "Support" },
    { value: "< 2 wks", label: "Onboarding" },
];

export default function HeroSection() {
    return (
        <section className={s.hero}>
            <div className={s.heroGlow1} />
            <div className={s.heroGlow2} />
            <div className={s.heroGlow3} />
            <div className={s.wrap}>
                <div className={s.heroRow}>
                    <div className={s.heroText}>
                        <span className={s.heroChip}>For print shops &amp; print-on-demand businesses</span>
                        <h1 className={s.heroH1}>
                            One platform to run your entire{" "}
                            <span className={s.heroAccent}>print operation.</span>
                        </h1>
                        <p className={s.heroSub}>
                            Manage your production queue, sync orders from 18 marketplaces, auto-generate shipping labels,
                            and track inventory — all in one dashboard. Built for print shops scaling beyond spreadsheets.
                        </p>
                        <div className={s.heroBtns}>
                            <a href="#calendar-booking-section" className={s.btnGold}>
                                Book a Free Demo
                            </a>
                            <a href="/pricing" className={s.btnWhiteOutline}>
                                See Pricing
                            </a>
                        </div>
                        <p className={s.heroCta}>
                            30-min demo &nbsp;·&nbsp; No commitment &nbsp;·&nbsp; No credit card
                        </p>
                        <div className={s.heroStats}>
                            {STATS.map((st) => (
                                <div key={st.label} className={s.heroStat}>
                                    <span className={s.heroStatVal}>{st.value}</span>
                                    <span className={s.heroStatLabel}>{st.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={s.heroVisual}>
                        <div className={s.heroCard}>
                            <Image
                                src={Logo}
                                alt="Pythias Technologies"
                                width={260}
                                height={320}
                                priority
                                style={{ width: "100%", maxWidth: 260, height: "auto" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
