import s from "./home.module.css";

const benefits = [
    {
        gradient: "linear-gradient(135deg, #D3A73D 0%, #f0c66a 100%)",
        icon: "⚡",
        title: "Automated Production",
        description: "Connect Brother GTX printers and folding machines. Job queuing, status tracking, and quality control workflows — fully automated.",
    },
    {
        gradient: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
        icon: "🚚",
        title: "Simplified Shipping",
        description: "Integrated USPS, FedEx, UPS, and more. Auto-generate labels, sync tracking, and deliver notifications without lifting a finger.",
    },
    {
        gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
        icon: "📦",
        title: "Smart Inventory",
        description: "Real-time stock tracking across all products and materials. Automated reorder points and supplier management prevent stockouts.",
    },
    {
        gradient: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
        icon: "🛒",
        title: "Marketplace Integration",
        description: "Sell on Amazon, Etsy, Walmart, Shopify, TikTok, and more from one dashboard. Orders route and fulfill automatically.",
    },
];

export default function BenefitsSection() {
    return (
        <section className={s.benefits}>
            <div className={s.wrap}>
                <div className={s.benefitsHead}>
                    <p className={s.sectionLabel}>Why Pythias</p>
                    <h2 className={s.sectionTitle}>Why Choose Pythias Technologies?</h2>
                    <p className={s.sectionSub}>
                        Everything you need to automate and scale your print-on-demand business — all in one platform.
                    </p>
                </div>
                <ul className={s.grid4}>
                    {benefits.map((b) => (
                        <li key={b.title} className={s.benefitCard}>
                            <div className={s.benefitIcon} style={{ background: b.gradient }}>{b.icon}</div>
                            <h3 className={s.benefitTitle}>{b.title}</h3>
                            <p className={s.benefitDesc}>{b.description}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
