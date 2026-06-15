import ProductCard from "../components/ProductCard";

// Featured products — PURE: renders products supplied via `data.products`.
// The app/editor fetches products (see ../server.js resolveSectionData) and passes
// them in, so this component is client-safe and renders identically in the editor preview.
export default function FeaturedProducts({ settings = {}, data = {} }) {
    const { heading = "Featured" } = settings;
    const products = data?.products ?? [];

    return (
        <section style={{ padding: "56px 0" }}>
            <div className="sf-container">
                {heading && <h2 style={{ fontSize: "1.9rem", margin: "0 0 24px" }}>{heading}</h2>}
                {products.length === 0 ? (
                    <p style={{ opacity: 0.6 }}>No products yet.</p>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
                        {products.map((p) => <ProductCard key={String(p._id)} product={p} />)}
                    </div>
                )}
            </div>
        </section>
    );
}
