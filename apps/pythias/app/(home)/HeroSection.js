import Image from "next/image";
import Logo from "../../public/logo_vertical.png";
import s from "./home.module.css";

const STATS = [
    { value: "18+",    label: "Marketplace Integrations" },
    { value: "200+",   label: "Channels via Mirakl & Acenda" },
    { value: "24/7",   label: "Support" },
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
                        <span className={s.heroChip}>Pythias Fulfillment Cloud</span>
                        <h1 className={s.heroH1}>
                            One platform to run your entire{" "}
                            <span className={s.heroAccent}>print operation.</span>
                        </h1>
                        <p className={s.heroSub}>
                            Pythias Fulfillment Cloud, Inventory, Shipping, Connect, and AI — five integrated products built for
                            print-on-demand operations, from production floor to final delivery.
                        </p>
                        <div className={s.heroBtns}>
                            <a href="#calendar-booking-section" className={s.btnGold}>
                                📅 Book a Demo
                            </a>
                            <a href="#lead-capture-section" className={s.btnWhiteOutline}>
                                🚀 Get Early Access
                            </a>
                        </div>
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
