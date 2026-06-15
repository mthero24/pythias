import Link from "next/link";
import s from "./home.module.css";

// Topical-authority block: names the core software categories Pythias spans, each linked to
// its dedicated page. Real capabilities only — no fabricated claims.
const CATEGORIES = [
    { term: "Print-on-demand software", desc: "Automate DTF, DTG, embroidery, and sublimation production from one queue.", href: "/software-for-print-on-demand" },
    { term: "Fulfillment software", desc: "Route orders, generate carrier labels, and confirm tracking back to every channel.", href: "/fulfillment-cloud" },
    { term: "Inventory management software", desc: "Real-time stock by product, color, and size with low-stock and reorder alerts.", href: "/inventory-management-software" },
    { term: "Marketplace management software", desc: "List and sync products across 18+ marketplaces from a single dashboard.", href: "/multichannel-listing-software" },
    { term: "Warehouse software", desc: "Track stock and move every order through one prioritized pick-pack-ship workflow.", href: "/inventory-management-software" },
    { term: "Ecommerce operations software", desc: "Unify orders, production, inventory, and shipping in one operations hub.", href: "/order-management-software" },
];

export default function SeoAuthoritySection() {
    return (
        <section className={s.clouds ? undefined : undefined} style={{ padding: "80px 0", background: "#f8faff" }}>
            <div className={s.wrap} style={{ padding: "0 24px" }}>
                <p className={s.sectionLabel}>One platform, every category</p>
                <h2 className={s.sectionTitle} style={{ marginBottom: 12 }}>
                    Print-on-demand, fulfillment, inventory, and marketplace software in one
                </h2>
                <p className={s.sectionSub} style={{ marginBottom: 48 }}>
                    Most sellers stitch together separate tools for production, fulfillment, inventory,
                    and marketplace management. Pythias replaces that stack with one platform for your
                    entire ecommerce operation.
                </p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: 16,
                    }}
                >
                    {CATEGORIES.map((c) => (
                        <Link
                            key={c.term}
                            href={c.href}
                            style={{
                                display: "block",
                                textDecoration: "none",
                                color: "inherit",
                                background: "#fff",
                                border: "1px solid #e6e9f2",
                                borderRadius: 14,
                                padding: "20px 22px",
                                transition: "box-shadow 120ms, border-color 120ms",
                            }}
                        >
                            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 6px", color: "#111827" }}>
                                {c.term}
                            </h3>
                            <p style={{ fontSize: "0.92rem", lineHeight: 1.6, margin: 0, color: "#4b5563" }}>
                                {c.desc}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
