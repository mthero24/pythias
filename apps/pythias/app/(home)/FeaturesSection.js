import s from "./home.module.css";

const features = [
    { color: "#D3A73D", icon: "🖨️", title: "Pythias Fulfillment Cloud",     desc: "The production OS for your print shop — manage job queues for DTF (direct-to-film), embroidery, sublimation, and screen print by deadline and priority. No whiteboards, no spreadsheets." },
    { color: "#6366f1", icon: "🚚", title: "Pythias Shipping",               desc: "Auto-generate USPS, FedEx, and UPS labels on order completion. Tracking syncs back to every marketplace — no manual steps." },
    { color: "#10b981", icon: "📦", title: "Pythias Inventory",              desc: "Real-time blank inventory tracking across all SKUs. Automated reorder alerts and supplier management prevent costly stockouts." },
    { color: "#ef4444", icon: "🛒", title: "Pythias Connect",                desc: "Amazon, Etsy, Walmart, TikTok, Shopify, and 15+ more — all orders unified in a single production view, auto-routed and fulfilled." },
    { color: "#8b5cf6", icon: "🤖", title: "Pythias AI",                     desc: "Production forecasting, AI-powered mockup generation, and intelligent listing copy trained on your catalog and order history." },
    { color: "#14b8a6", icon: "👥", title: "Team Collaboration",             desc: "Role-based access, built-in messaging, activity logs, badge scan login, and shift management — built into Fulfillment Cloud." },
    { color: "#f59e0b", icon: "🏷️", title: "Label & Barcode Printing",      desc: "Print production labels, packing slips, and barcodes for any order directly from your dashboard — no third-party tools." },
    { color: "#3b82f6", icon: "📊", title: "Analytics & Reporting",          desc: "Daily output reports, line efficiency metrics, revenue by channel, and custom date-range exports across all five products." },
];

export default function FeaturesSection() {
    return (
        <section className={s.featSection} id="features-section">
            <div className={s.wrap}>
                <p className={s.sectionLabel}>Product Suite</p>
                <h2 className={s.sectionTitle}>Five integrated products. One platform.</h2>
                <p className={s.sectionSub} style={{ marginBottom: 48 }}>
                    Pythias Fulfillment Cloud, Inventory, Shipping, Connect, and AI — each a best-in-class product, all working together from day one.
                </p>
                <ul className={s.feat8}>
                    {features.map((f) => (
                        <li key={f.title} className={s.featCard}>
                            <div className={s.featIconBox} style={{ background: f.color + "18", color: f.color }}>
                                {f.icon}
                            </div>
                            <h3 className={s.featCardTitle}>{f.title}</h3>
                            <p className={s.featCardDesc}>{f.desc}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
