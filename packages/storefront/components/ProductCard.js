// Pure product card — used by the FeaturedProducts section and the /products listing.
// Takes a plain product object (works for both lean DB docs and JSON from an API).
export default function ProductCard({ product }) {
    const img = product.productImages?.find((i) => i.image)?.image ?? null;
    const prices = (product.variantsArray ?? []).map((v) => v.price).filter((n) => typeof n === "number" && n > 0);
    const from = prices.length ? Math.min(...prices) : null;
    return (
        <a href={`/products/${String(product._id)}`} style={{ display: "block" }}>
            <div style={{ aspectRatio: "1/1", background: "#f3f4f6", borderRadius: 10, overflow: "hidden" }}>
                {img && <img src={img} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
            <div style={{ marginTop: 10, fontWeight: 600, fontSize: "0.95rem" }}>{product.title}</div>
            {from != null && <div style={{ color: "var(--sf-secondary)", fontWeight: 700, marginTop: 2 }}>${from.toFixed(2)}</div>}
        </a>
    );
}
