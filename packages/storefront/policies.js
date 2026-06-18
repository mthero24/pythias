// Built-in legal/policy pages every store should have. Stored on the site as `policies: [{ slug, title,
// body }]`; built-ins are created on first edit (like system pages), and sellers can add custom ones.
export const POLICY_TYPES = [
    { slug: "terms",    label: "Terms of Service",       title: "Terms of Service" },
    { slug: "returns",  label: "Return & Refund Policy", title: "Returns & Refunds" },
    { slug: "privacy",  label: "Privacy Policy",         title: "Privacy Policy" },
    { slug: "shipping", label: "Shipping Policy",        title: "Shipping Policy" },
];
export const POLICY_BY_SLUG = Object.fromEntries(POLICY_TYPES.map((p) => [p.slug, p]));
export const POLICY_SLUGS = new Set(POLICY_TYPES.map((p) => p.slug));
