import Link from "next/link";
import s from "./home.module.css";

const SELLERS = {
    label: "For Sellers & Brand Owners",
    chip: "Commerce Cloud",
    chipStyle: { background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "#6366f1" },
    heading: "Sell everywhere. Touch nothing.",
    sub: "List products across every major marketplace and let vetted fulfillment partners handle printing, packing, and shipping. You focus on the brand.",
    outcomes: [
        { icon: "🛒", text: "Publish to Shopify, Etsy, Amazon, Walmart, TikTok & 13 more from one catalog" },
        { icon: "📦", text: "Manage all your products and designs in one place — sync to every channel automatically" },
        { icon: "🔄", text: "Inventory and order status sync in real time across every storefront" },
        { icon: "🚚", text: "Orders route automatically to the best fulfillment partner — you never touch the product" },
        { icon: "📊", text: "See revenue, margin, and channel performance in one dashboard" },
    ],
    cta: { label: "Explore Commerce Cloud →", href: "/commerce-cloud" },
    accentColor: "#6366f1",
    cardBg: "linear-gradient(145deg, #0d0d1f 0%, #08081a 100%)",
    border: "1.5px solid rgba(99,102,241,0.25)",
};

const PRODUCERS = {
    label: "For Print Shops & Fulfillment Operations",
    chip: "Fulfillment Cloud",
    chipStyle: { background: "rgba(211,167,61,0.12)", border: "1px solid rgba(211,167,61,0.3)", color: "#D3A73D" },
    heading: "Run your entire production floor from one screen.",
    sub: "Orders from every marketplace drop into one sorted queue. Your team prints, packs, and ships — with labels generating automatically and tracking syncing back to every channel.",
    outcomes: [
        { icon: "🖨️", text: "Manage DTF, DTG, embroidery, sublimation & screen print jobs from one production queue" },
        { icon: "🏷️", text: "Shipping labels (USPS, FedEx, UPS, DHL) auto-generate when a job scan is completed" },
        { icon: "📦", text: "Track blank inventory in real time — automated reorder alerts before you run out" },
        { icon: "🛒", text: "Orders flow in from 18 marketplaces automatically — no manual importing" },
        { icon: "📈", text: "Scale operations with team management, analytics, and multi-user access" },
    ],
    cta: { label: "Explore Fulfillment Cloud →", href: "/fulfillment-cloud" },
    accentColor: "#D3A73D",
    cardBg: "linear-gradient(145deg, #1a1408 0%, #110f04 100%)",
    border: "1.5px solid rgba(211,167,61,0.25)",
};

function AudienceCard({ data }) {
    return (
        <div className={s.outcomeCard} style={{ background: data.cardBg, border: data.border }}>
            <span className={s.outcomeChip} style={data.chipStyle}>{data.chip}</span>
            <p className={s.outcomeAudience}>{data.label}</p>
            <h3 className={s.outcomeHeading}>{data.heading}</h3>
            <p className={s.outcomeSub}>{data.sub}</p>
            <ul className={s.outcomeList}>
                {data.outcomes.map((o) => (
                    <li key={o.text} className={s.outcomeItem}>
                        <span className={s.outcomeIcon}>{o.icon}</span>
                        <span>{o.text}</span>
                    </li>
                ))}
            </ul>
            <Link
                href={data.cta.href}
                className={s.outcomeBtn}
                style={{ background: data.accentColor, color: data.accentColor === "#D3A73D" ? "#111" : "#fff" }}
            >
                {data.cta.label}
            </Link>
        </div>
    );
}

export default function OutcomesSection() {
    return (
        <section className={s.outcomesSection}>
            <div className={s.wrap}>
                <div className={s.outcomesHead}>
                    <p className={s.sectionLabel}>Built for two types of businesses</p>
                    <h2 className={s.sectionTitle} style={{ color: "#fff" }}>Which one are you?</h2>
                    <p className={s.sectionSub} style={{ color: "rgba(255,255,255,0.6)" }}>
                        Pythias has a product for sellers who don&apos;t own equipment and for print shops that do.
                        Both connect to the same 18+ marketplaces.
                    </p>
                </div>
                <div className={s.outcomesGrid}>
                    <AudienceCard data={SELLERS} />
                    <AudienceCard data={PRODUCERS} />
                </div>
            </div>
        </section>
    );
}
