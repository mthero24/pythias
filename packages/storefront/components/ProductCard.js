// Pure product card — used by the FeaturedProducts section and the /products listing.
// Takes a plain product object (works for both lean DB docs and JSON from an API). Optional
// `rating` ({avg,count}) shows star social proof.
export default function ProductCard({ product, rating }) {
    const img = product.productImages?.find((i) => i.image)?.image ?? null;
    const prices = (product.variantsArray ?? []).map((v) => v.price).filter((n) => typeof n === "number" && n > 0);
    const from = prices.length ? Math.min(...prices) : null;
    const r = rating?.count > 0 ? Math.round(rating.avg) : 0;
    return (
        <a href={`/products/${String(product._id)}`} style={{ display: "block" }}>
            <div style={{ aspectRatio: "1/1", background: "#f3f4f6", borderRadius: 10, overflow: "hidden" }}>
                {img && <img src={img} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
            <div style={{ marginTop: 10, fontWeight: 600, fontSize: "0.95rem" }}>{product.title}</div>
            {rating?.count > 0 && <div style={{ fontSize: "0.8rem" }}><span style={{ color: "#f59e0b" }}>{"★★★★★".slice(0, r)}{"☆☆☆☆☆".slice(0, 5 - r)}</span> <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>({rating.count})</span></div>}
            {from != null && <div style={{ color: "var(--sf-secondary)", fontWeight: 700, marginTop: 2 }}>${from.toFixed(2)}</div>}
        </a>
    );
}
