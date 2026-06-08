// Returns { base, suffix } for renderImages URLs.
// Always uses relative /api/renderImages so it resolves correctly on any domain
// (localhost dev, simplysage, platform) without hardcoding hostnames.
// Platform adds orgSlug so the route can look up the correct org.
export const renderUrlParts = (source, slug) => {
    const base   = "/api/renderImages";
    const suffix = source === "platform" && slug ? `&orgSlug=${slug}` : "";
    return { base, suffix };
};
