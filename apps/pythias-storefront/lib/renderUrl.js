// Build a renderImages URL. Platform (Commerce Cloud) storefronts render through the shared platform
// host with the org passed as the `orgSlug` query param — NOT an <orgSlug> subdomain. The query form
// composites the given `art` onto the blank's box for `side`, so a single-image design can be shown on
// any spot just by passing its one art URL + the target side. `srcSide` is only needed for the path/keyed
// form (proof/listings). Returns null if it can't build.
//
// Shared by the product-page preview, the cart/order line image, and (conceptually) the print proof.
const RENDER_HOST = process.env.NEXT_PUBLIC_RENDER_HOST || "platform.pythiastechnologies.com";

export function buildRenderUrl({ orgSlug, blankCode, colorName, art, side, srcSide, width = 700 }) {
    if (!orgSlug || !blankCode || !art || !side) return null;
    const p = new URLSearchParams({ orgSlug, blank: blankCode, design: art, side, width: String(width) });
    if (colorName) p.set("colorName", colorName);
    if (srcSide) p.set("srcSide", srcSide);
    // http for localhost (point NEXT_PUBLIC_RENDER_HOST at the patched local platform, e.g. localhost:3010).
    const proto = /^(localhost|127\.)/.test(RENDER_HOST) ? "http" : "https";
    return `${proto}://${RENDER_HOST}/api/renderImages?${p.toString()}`;
}
