import Link from "next/link";
import s from "./home.module.css";

const FC_BULLETS = [
    "Manage orders, production, and shipping from one OS",
    "18+ marketplace integrations — TikTok, Shopify, Etsy, Amazon, and more",
    "DTG, embroidery, sublimation, and DTF production automation",
    "Real-time inventory, analytics, and multi-user access",
];

const CC_BULLETS = [
    "List products across every channel — no warehouse needed",
    "Orders route automatically to vetted fulfillment partners",
    "Pre-funded wallet charges only when orders are placed",
    "Fee on your margin, not your revenue",
];

export default function CloudsSection() {
    return (
        <section className={s.clouds}>
            <div className={s.wrap} style={{ padding: "0 24px" }}>
                <p className={s.sectionLabel}>Two Products. One Platform.</p>
                <h2 className={s.sectionTitle} style={{ marginBottom: 12 }}>
                    Run fulfillment — or just sell.
                </h2>
                <p className={s.sectionSub} style={{ marginBottom: 56 }}>
                    Whether you own production equipment or want to sell without it,
                    Pythias has a product built for your business model.
                </p>

                <div className={s.cloudsGrid}>
                    {/* Fulfillment Cloud */}
                    <div className={`${s.cloudCard} ${s.cloudCardFC}`}>
                        <div className={s.cloudCardInner}>
                            <img
                                src="/fullfilment_cloud_transparant.png"
                                alt="Pythias Fulfillment Cloud"
                                className={s.cloudLogo}
                            />
                            <p className={s.cloudChip} style={{ background: "rgba(211,167,61,0.15)", border: "1px solid rgba(211,167,61,0.3)", color: "#D3A73D" }}>
                                For producers &amp; fulfillment operations
                            </p>
                            <h3 className={s.cloudTitle}>You own the production floor.</h3>
                            <p className={s.cloudSub}>
                                Pythias Fulfillment Cloud is the operating system for print shops,
                                embroidery studios, and POD operations — managing every order from
                                channel intake to final shipment.
                            </p>
                            <ul className={s.cloudList}>
                                {FC_BULLETS.map(b => (
                                    <li key={b} className={s.cloudListItem}>
                                        <span className={s.cloudCheck} style={{ color: "#D3A73D" }}>✓</span>
                                        {b}
                                    </li>
                                ))}
                            </ul>
                            <div className={s.cloudFooter}>
                                <Link href="/pricing" className={s.cloudBtnGold}>
                                    See Fulfillment Cloud Plans →
                                </Link>
                                <Link href="/#calendar-booking-section" className={s.cloudBtnGhost} style={{ borderColor: "rgba(211,167,61,0.3)", color: "rgba(255,255,255,0.6)" }}>
                                    Book a Demo
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Commerce Cloud */}
                    <div className={`${s.cloudCard} ${s.cloudCardCC}`}>
                        <div className={s.cloudCardInner}>
                            <img
                                src="/commerce-cloud-logo.png"
                                alt="Pythias Commerce Cloud"
                                className={s.cloudLogo}
                            />
                            <p className={s.cloudChip} style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", color: "#a5b4fc" }}>
                                For sellers &amp; brand owners
                            </p>
                            <h3 className={s.cloudTitle}>You own the brand. We handle the rest.</h3>
                            <p className={s.cloudSub}>
                                Pythias Commerce Cloud lets you sell across every marketplace without
                                owning production equipment. Orders route automatically to fulfillment
                                partners — you keep the margin.
                            </p>
                            <ul className={s.cloudList}>
                                {CC_BULLETS.map(b => (
                                    <li key={b} className={s.cloudListItem}>
                                        <span className={s.cloudCheck} style={{ color: "#a5b4fc" }}>✓</span>
                                        {b}
                                    </li>
                                ))}
                            </ul>
                            <div className={s.cloudFooter}>
                                <Link href="/commerce-cloud" className={s.cloudBtnIndigo}>
                                    See Commerce Cloud →
                                </Link>
                                <Link href="/#calendar-booking-section" className={s.cloudBtnGhost} style={{ borderColor: "rgba(99,102,241,0.3)", color: "rgba(255,255,255,0.6)" }}>
                                    Book a Demo
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
