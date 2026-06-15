// Pre-built, good-looking storefront presets a seller picks from. Each is a curated
// palette + font pairing + a ready-made home layout (sections with placeholder copy),
// so picking one yields a complete, polished site immediately. The editor's "themes"
// gallery lists these; applyPreset() turns a choice into StorefrontSite content.
//
// Fonts referenced here are loaded by the storefront app (and editor) — see the app's
// layout font <link>. Keep new fonts in sync with that list.

const baseNav = { links: [{ label: "Shop", href: "/products" }, { label: "About", href: "#about" }], showCart: true };

function home(hero, { featuredHeading = "Featured", aboutBody }) {
    return [{
        slug: "home",
        title: "Home",
        sections: [
            { type: "hero", settings: hero },
            { type: "featuredProducts", settings: { heading: featuredHeading, limit: 8 } },
            { type: "richText", settings: { heading: "About us", body: aboutBody, align: "left" } },
        ],
    }];
}

export const THEME_PRESETS = [
    {
        id: "classic",
        name: "Classic",
        description: "Clean and modern — a confident all-rounder that fits any brand.",
        swatch: ["#1a1a2e", "#e94560", "#f59e0b"],
        theme: {
            baseThemeId: "classic",
            colors: { primary: "#1a1a2e", secondary: "#e94560", background: "#ffffff", text: "#16181d", accent: "#6366f1" },
            fonts: { heading: "Space Grotesk", body: "Inter" },
        },
        nav: baseNav,
        footer: { links: [{ label: "Contact", href: "#contact" }], socials: [] },
        pages: home(
            { headline: "", subheadline: "Quality goods, made to order.", ctaText: "Shop the collection", ctaLink: "/products", align: "center" },
            { aboutBody: "We design and fulfill every order through the Pythias network — so you get great products without the overhead." },
        ),
    },
    {
        id: "editorial",
        name: "Editorial",
        description: "Warm, premium serif look — great for apparel & lifestyle brands.",
        swatch: ["#F4F1EA", "#2b2b2b", "#C4622D"],
        theme: {
            baseThemeId: "editorial",
            colors: { primary: "#2b2b2b", secondary: "#C4622D", background: "#F4F1EA", text: "#2b2b2b", accent: "#C4622D" },
            fonts: { heading: "Fraunces", body: "Inter" },
        },
        nav: baseNav,
        footer: { links: [{ label: "Contact", href: "#contact" }], socials: [] },
        pages: home(
            { headline: "", subheadline: "Considered design, made to last.", ctaText: "Explore", ctaLink: "/products", align: "left" },
            { featuredHeading: "Latest", aboutBody: "A small studio with big standards. Everything is printed and shipped to order." },
        ),
    },
    {
        id: "mono",
        name: "Mono",
        description: "Minimal black & white with lots of breathing room. Streetwear-ready.",
        swatch: ["#ffffff", "#111111", "#ff3b30"],
        theme: {
            baseThemeId: "mono",
            colors: { primary: "#111111", secondary: "#ff3b30", background: "#ffffff", text: "#111111", accent: "#111111" },
            fonts: { heading: "Inter", body: "Inter" },
        },
        nav: baseNav,
        footer: { links: [{ label: "Contact", href: "#contact" }], socials: [] },
        pages: home(
            { headline: "", subheadline: "No fluff. Just good product.", ctaText: "Shop", ctaLink: "/products", align: "center" },
            { featuredHeading: "Drops", aboutBody: "Limited runs, printed on demand. When it's gone, it's gone." },
        ),
    },
    {
        id: "midnight",
        name: "Midnight",
        description: "Bold dark mode with an electric accent. Modern and high-contrast.",
        swatch: ["#0f1115", "#f5f5f5", "#7c5cff"],
        theme: {
            baseThemeId: "midnight",
            colors: { primary: "#0f1115", secondary: "#7c5cff", background: "#0f1115", text: "#f5f5f5", accent: "#7c5cff" },
            fonts: { heading: "Space Grotesk", body: "Inter" },
        },
        nav: baseNav,
        footer: { links: [{ label: "Contact", href: "#contact" }], socials: [] },
        pages: home(
            { headline: "", subheadline: "Built different. Shipped fast.", ctaText: "Shop now", ctaLink: "/products", align: "center" },
            { featuredHeading: "Featured", aboutBody: "Designed in the dark, made to stand out." },
        ),
    },
    {
        id: "sunset",
        name: "Sunset",
        description: "Friendly and warm — peachy tones with a rounded, approachable feel.",
        swatch: ["#fff8f3", "#ff7a59", "#ff5277"],
        theme: {
            baseThemeId: "sunset",
            colors: { primary: "#3a2a26", secondary: "#ff5277", background: "#fff8f3", text: "#3a2a26", accent: "#ff7a59" },
            fonts: { heading: "Poppins", body: "Inter" },
        },
        nav: baseNav,
        footer: { links: [{ label: "Contact", href: "#contact" }], socials: [] },
        pages: home(
            { headline: "", subheadline: "Good vibes, great gear.", ctaText: "Start shopping", ctaLink: "/products", align: "center" },
            { aboutBody: "We make feel-good products and print them just for you." },
        ),
    },
    {
        id: "forest",
        name: "Forest",
        description: "Earthy and grounded — natural greens with a serif headline. Outdoorsy.",
        swatch: ["#f3f5f1", "#2f6f4f", "#caa45d"],
        theme: {
            baseThemeId: "forest",
            colors: { primary: "#22382c", secondary: "#2f6f4f", background: "#f3f5f1", text: "#22382c", accent: "#caa45d" },
            fonts: { heading: "Fraunces", body: "Inter" },
        },
        nav: baseNav,
        footer: { links: [{ label: "Contact", href: "#contact" }], socials: [] },
        pages: home(
            { headline: "", subheadline: "Made for the outdoors.", ctaText: "Browse gear", ctaLink: "/products", align: "left" },
            { featuredHeading: "Trail-tested", aboutBody: "Durable goods for people who'd rather be outside." },
        ),
    },
];

export const PRESET_BY_ID = Object.fromEntries(THEME_PRESETS.map((p) => [p.id, p]));

// Turn a chosen preset into the StorefrontSite content fields. Injects the brand name
// into the hero headline and the footer copyright. Deep-clones so callers can mutate.
export function applyPreset(presetOrId, { name = "" } = {}) {
    const preset = typeof presetOrId === "string" ? PRESET_BY_ID[presetOrId] : presetOrId;
    if (!preset) return null;
    const pages = JSON.parse(JSON.stringify(preset.pages));
    const hero = pages?.[0]?.sections?.find((s) => s.type === "hero");
    if (hero && !hero.settings.headline) hero.settings.headline = name || "Your store";
    return {
        theme: JSON.parse(JSON.stringify(preset.theme)),
        nav: JSON.parse(JSON.stringify(preset.nav)),
        footer: { ...JSON.parse(JSON.stringify(preset.footer)), text: preset.footer.text || `© ${name}` },
        pages,
    };
}
