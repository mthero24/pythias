// Product URL helpers. Stores choose how product links look (site.productUrlMode):
//   "slug" (default, best SEO — uses the product's stored slug) | "sku" | "id".
// Links always fall back to the _id when the chosen form is missing, so they never break; the
// detail route resolves by _id / slug / sku regardless, so old _id links keep working too.

export function slugifyName(s) {
    return String(s || "")
        .toLowerCase().trim()
        .replace(/['’"]/g, "")           // drop apostrophes/quotes so "men's" → "mens"
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")     // any other non-alphanumeric → dash
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "product";
}

export function productHref(product, mode = "slug") {
    if (!product) return "/products";
    const id = String(product._id ?? product.id ?? "");
    if (mode === "slug" && product.slug) return `/products/${product.slug}`;
    if (mode === "sku" && product.sku) return `/products/${encodeURIComponent(product.sku)}`;
    return `/products/${id}`;
}
