import s from "./home.module.css";

const features = [
    { color: "#D3A73D", icon: "🖨️", title: "Production Queue Management",   desc: "DTF, embroidery, sublimation, and screen print queues organized by deadline, type, and priority." },
    { color: "#6366f1", icon: "🚚", title: "Shipping & Carrier Integration",  desc: "Auto-generate USPS, FedEx, and UPS labels on order completion. Tracking syncs back to every marketplace." },
    { color: "#10b981", icon: "📦", title: "Inventory & Stock Control",       desc: "Real-time blank inventory tracking, automated reorder alerts, and supplier management in one place." },
    { color: "#ef4444", icon: "🛒", title: "Multi-Marketplace Orders",        desc: "Amazon, Etsy, Walmart, TikTok, Shopify, and Kohl's — all orders unified in a single production view." },
    { color: "#8b5cf6", icon: "📊", title: "Analytics & Reporting",           desc: "Daily output reports, line efficiency metrics, order status dashboards, and custom date-range exports." },
    { color: "#14b8a6", icon: "👥", title: "Team Collaboration",              desc: "Built-in messaging, role-based access, activity logs, and shift management keep your floor aligned." },
    { color: "#f59e0b", icon: "🏷️", title: "Label & Barcode Printing",       desc: "Print production labels, packing slips, and barcodes for any order directly from your dashboard." },
    { color: "#3b82f6", icon: "📍", title: "Order Tracking & Visibility",     desc: "Real-time tracking from production start to delivery. Customers and staff always know where orders stand." },
];

export default function FeaturesSection() {
    return (
        <section className={s.featSection} id="features-section">
            <div className={s.wrap}>
                <p className={s.sectionLabel}>Features</p>
                <h2 className={s.sectionTitle}>Everything you need to run your print shop.</h2>
                <p className={s.sectionSub} style={{ marginBottom: 48 }}>
                    Powerful features designed to automate every aspect of your workflow — from first order to final delivery.
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
