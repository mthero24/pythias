import ProductCard from "../components/ProductCard";

// Collection grid — PURE: renders a curated collection's products (resolved server-side from the
// collection's rules/manual picks via ../server.js). Lets a landing page or the homepage embed a real,
// auto-updating collection. Heading falls back to the collection's title.
export default function Collection({ settings = {}, data = {}, site }) {
    const products = data?.products ?? [];
    const heading = settings.heading || data?.title || "";
    const urlMode = site?.productUrlMode || "slug";
    const showSwatches = site?.catalog?.showSwatches !== false;
    const showAltView = site?.catalog?.showAltView !== false;
    const quickAdd = site?.catalog?.quickAdd !== false;
    if (!products.length) return null;
    return (
        <section style={{ padding: "56px 0" }}>
            <div className="sf-container">
                {heading && <h2 style={{ fontSize: "1.9rem", margin: "0 0 24px" }}>{heading}</h2>}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
                    {products.map((p) => <ProductCard key={p.id || String(p._id)} product={p} urlMode={urlMode} showSwatches={showSwatches} showAltView={showAltView} quickAdd={quickAdd} />)}
                </div>
            </div>
        </section>
    );
}
