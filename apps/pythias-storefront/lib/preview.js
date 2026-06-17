// Draft-preview gate. The storefront editor loads the live store in an iframe with `?preview=1`
// to show UNPUBLISHED draft edits. We must NOT let the public view another store's draft, so:
//   - dev/localhost: allowed (the seller's own machine)
//   - production: only with a valid signed token (TODO: wire `pv` HMAC when previewing prod domains)
export function previewAllowed(searchParams) {
    const sp = searchParams || {};
    if (!sp.preview && !sp.pv) return false;
    if (process.env.NODE_ENV !== "production") return true;
    // TODO(prod): verify a signed `pv` token (HMAC of siteId+expiry) minted by the platform editor.
    return false;
}

// Overlay the saved draft (theme/pages/nav/footer/…) onto the live site for rendering.
export function withDraft(site, preview) {
    if (preview && site?.draft && Object.keys(site.draft).length) return { ...site, ...site.draft };
    return site;
}
