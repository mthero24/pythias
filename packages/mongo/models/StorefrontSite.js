import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// One storefront per org (multi-tenant: a single Next.js app serves all sites,
// differentiated entirely by this data, resolved from the request host).
//
// A page is an ORDERED LIST OF SECTIONS — `{ type, settings }`. Section React
// components + their settings schemas live in the storefront app's section registry;
// the DB only stores which sections are on a page and their config. This same tree is
// what the drag-to-reorder editor and the (paid) AI assistant both edit.

const Section = new mongoose.Schema({
    type:     { type: String, required: true },   // registry key: "hero" | "featuredProducts" | "richText" | ...
    settings: { type: mongoose.Schema.Types.Mixed, default: {} }, // per-type config (validated in app code)
}, { _id: true });

const Page = new mongoose.Schema({
    slug:     { type: String, required: true },   // "home", "about", "faq", or custom
    title:    { type: String, default: "" },
    sections: { type: [Section], default: [] },
    seo:      {
        title:       { type: String },
        description: { type: String },
        ogImage:     { type: String },
    },
}, { _id: true });

const Theme = new mongoose.Schema({
    baseThemeId: { type: String, default: "apparel" }, // starter theme this site was forked from
    colors: {
        primary:    { type: String, default: "#1a1a2e" },
        secondary:  { type: String, default: "#e94560" },
        background: { type: String, default: "#ffffff" },
        text:       { type: String, default: "#111111" },
        accent:     { type: String, default: "#f59e0b" },
    },
    fonts: {
        heading: { type: String, default: "Inter" },
        body:    { type: String, default: "Inter" },
    },
    logoUrl: { type: String },
    favicon: { type: String },
}, { _id: false });

const schema = new mongoose.Schema({
    // An org can run MULTIPLE storefronts (extra stores billed per the plan). The entitlement
    // (plan + subscription) lives on the `primary` site; secondary sites share the org's catalog.
    orgId:  { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name:   { type: String, default: "My store" },
    primary:{ type: Boolean, default: true },   // the entitlement-bearing site
    status: { type: String, enum: ["draft", "published", "disabled"], default: "draft" },
    // "commerce" = storefront with products/cart/checkout.
    // "business" = brochure / lead-gen site for professionals (no cart) — gates which
    // section types and features (cart, lead capture) are available.
    siteType: { type: String, enum: ["commerce", "business"], default: "commerce" },

    // ── Domains ──────────────────────────────────────────────────────────────
    subdomain: { type: String, unique: true, sparse: true, lowercase: true, trim: true }, // brand → brand.pythias.store
    customDomain: {
        hostname:    { type: String, lowercase: true, trim: true },
        status:      { type: String, enum: ["pending", "active", "failed"], default: "pending" },
        cfHostnameId:{ type: String },   // Cloudflare for SaaS Custom Hostname id (SSL)
        verifiedAt:  { type: Date },
    },

    // ── Plan / billing flags ─────────────────────────────────────────────────
    // Custom domain is bundled into the Storefront tier (gated by `plan`), not sold per-URL.
    plan:      { type: String, enum: ["none", "starter", "pro", "enterprise"], default: "none" },
    // Storefront add-on subscription (separate from the org's platform tier). `plan !== "none"`
    // is what unlocks the storefront tools in the menu — set by the billing webhook on payment.
    subscription: {
        stripeSubscriptionId: { type: String },
        status:               { type: String },   // active | past_due | canceled
        startedAt:            { type: Date },
        canceledAt:           { type: Date },
        extraStoreItemId:     { type: String },    // Stripe subscription-item id for billed extra stores
    },
    aiEnabled: { type: Boolean, default: false },   // separate paid add-on — gates the AI editor
    appEnabled:{ type: Boolean, default: false },   // separate paid add-on — white-label mobile app
    // Identifies this storefront to its white-label mobile app build (mobile has no host
    // header). The app sends this; the API resolves the org from it. Web uses the host.
    appKey:    { type: String, unique: true, sparse: true, index: true },

    // ── Content (the live, published site) ───────────────────────────────────
    theme:  { type: Theme, default: () => ({}) },
    pages:  { type: [Page], default: [] },
    nav:    {
        links:    [{ label: String, href: String }],
        showCart: { type: Boolean, default: true },
    },
    footer: {
        links:   [{ label: String, href: String }],
        socials: [{ platform: String, url: String }],
        text:    { type: String },
    },

    // ── Legal/policy pages (built-ins: terms/returns/privacy/shipping + custom). Rendered at
    //    /policies/:slug and auto-linked in the footer. ─────────────────────────────────────
    policies: [{ slug: String, title: String, body: String, builtin: Boolean }],

    // ── Customizable system pages (404 + runtime error). ─────────────────────────────────────
    system: {
        notFound: { title: String, message: String, ctaText: String, ctaLink: String },
        error:    { title: String, message: String, ctaText: String, ctaLink: String },
    },

    // How product URLs are formed: "slug" (SEO name, default), "sku", or "id" (Mongo _id).
    productUrlMode: { type: String, enum: ["slug", "sku", "id"], default: "slug" },

    // Catalog display: filters (which + how they show, per device) and product-card options.
    catalog: {
        filterDisplay: {
            desktop: { type: String, enum: ["sidebar", "menu"], default: "sidebar" },   // sidebar = live; menu = button → drawer
            mobile:  { type: String, enum: ["sidebar", "menu"], default: "menu" },
        },
        drawerSide: { type: String, enum: ["left", "right", "top", "bottom"], default: "left" },   // where the filter drawer slides from
        filters: {
            department: { type: Boolean, default: true },
            category:   { type: Boolean, default: true },
            color: { type: Boolean, default: true },
            size:  { type: Boolean, default: true },
            brand: { type: Boolean, default: true },
            price: { type: Boolean, default: true },
        },
        showSwatches: { type: Boolean, default: true },   // color swatches on cards
        showAltView:  { type: Boolean, default: true },   // back/sleeve "more views" badge on cards
        quickAdd:     { type: Boolean, default: true },   // hover "+" quick-add button on cards
        addToCartModal: { type: Boolean, default: false },   // pop a confirmation modal on add-to-cart
    },

    // Old-path → new-path 301 redirects (built by the AI link migrator). ────────────────────
    redirects: [{ from: String, to: String }],

    // Curated search/category terms that ARE allowed to be indexed as /products/<term> landing pages.
    // Everything else under /products renders for users but is noindex (avoids infinite search-page crawl).
    indexableTerms: [String],

    // Pre-generated SEO copy for the curated terms above (so it's server-rendered in the HTML for crawlers,
    // never generated on the page-load path). term = slugified; h1 + description.
    termContent: [{ term: String, h1: String, description: String }],

    // ── Analytics / tracking (IDs only; scripts injected by the storefront) ──
    analytics: {
        ga4Id:         { type: String },   // Google tag / GA4  "G-XXXXXXX"
        gtmId:         { type: String },   // Google Tag Manager "GTM-XXXXXXX"
        metaPixelId:   { type: String },   // Meta / Facebook pixel
        tiktokPixelId: { type: String },
        snapPixelId:   { type: String },
        pinterestTagId:{ type: String },
    },

    // ── Business info (powers Contact page, footer, and JSON-LD schema) ──────
    businessInfo: {
        legalName: { type: String },
        email:     { type: String },
        phone:     { type: String },
        address:   { street: String, city: String, state: String, postalCode: String, country: { type: String, default: "US" } },
        socials:   [{ platform: String, url: String }],
    },

    // ── Shipping (seller-controlled) ─────────────────────────────────────────
    shipping: {
        flatRateCents: { type: Number, default: 0 },   // charge per order
        freeShipping:  { type: Boolean, default: false }, // always free (advertise it)
        freeOverCents: { type: Number, default: 0 },   // free when subtotal ≥ this (0 = off)
    },

    // ── Rewards (seller-configurable loyalty / store credit) ─────────────────
    rewards: {
        enabled:          { type: Boolean, default: false },
        earnPercent:      { type: Number, default: 0 },     // reward $ earned = subtotal × earnPercent%
        signupBonusCents: { type: Number, default: 0 },     // reward $ granted on account creation
        maxRedeemPercent: { type: Number, default: 100 },   // cap redemption to % of an order's subtotal
        currency:         { type: String, default: "USD" },
    },

    // ── Signup popup (seller-configurable email/SMS capture + optional discount) ──
    // Shown to visitors who aren't signed in. The seller decides whether to use it and
    // what discount (if any) to offer in exchange for their email/phone + consent.
    popup: {
        enabled:       { type: Boolean, default: false },
        headline:      { type: String, default: "Get 10% off your first order" },
        body:          { type: String, default: "Join our list for exclusive deals." },
        collectPhone:  { type: Boolean, default: false },   // also capture phone (SMS consent)
        requirePhone:  { type: Boolean, default: false },
        // Discount granted on signup (none = pure list-building).
        discountType:  { type: String, enum: ["none", "percent", "fixed"], default: "percent" },
        discountValue: { type: Number, default: 10 },        // percent or cents
        codePrefix:    { type: String, default: "WELCOME" }, // generated code prefix
        buttonText:    { type: String, default: "Get my discount" },
        delaySeconds:  { type: Number, default: 5 },         // show after N seconds
        // legal/consent copy stored as proof when the visitor opts in
        emailConsentText: { type: String, default: "I agree to receive marketing emails. Unsubscribe anytime." },
        smsConsentText:   { type: String, default: "I agree to receive marketing texts. Msg & data rates may apply. Reply STOP to opt out." },
    },

    // ── Internationalization ──────────────────────────────────────────────────
    // Prices are stored in the base currency (USD cents); `currencies[].rate` = units per 1 base
    // for DISPLAY conversion. Languages drive the AI-translated UI dictionary + content.
    i18n: {
        defaultCurrency: { type: String, default: "USD" },
        currencies: { type: [{ code: String, symbol: String, rate: { type: Number, default: 1 } }], default: [] },
        defaultLang:  { type: String, default: "en" },
        languages:    { type: [String], default: [] },   // extra languages beyond default
    },

    // ── Subscriptions (subscribe & save) ───────────────────────────────────────
    subscriptions: {
        enabled:         { type: Boolean, default: false },
        discountPercent: { type: Number, default: 10 },    // off recurring orders
        intervals: { type: [{ label: String, days: Number }], default: [{ label: "Every month", days: 30 }, { label: "Every 2 months", days: 60 }, { label: "Every 3 months", days: 90 }] },
    },

    // ── Returns / RMA ────────────────────────────────────────────────────────
    returns: {
        enabled:      { type: Boolean, default: true },
        windowDays:   { type: Number, default: 30 },     // days after order to allow a return
        instructions: { type: String, default: "Tell us what's wrong and we'll make it right." },
    },

    // ── Autopilot (scheduled autonomous optimization) ───────────────────────
    // When `autonomous` is on, the daily cron runs autopilot for this store without a
    // click. With `autoApply` on, it also applies ZERO-RISK actions automatically
    // (UI translation, popup A/B test) — money/sending actions (discounts, flows,
    // campaigns) are always left as one-click recommendations for the seller to review.
    autopilot: {
        autonomous: { type: Boolean, default: false },
        autoApply:  { type: Boolean, default: false },
        lastRunAt:  { type: Date },
    },

    // ── Site-level SEO defaults (per-page seo overrides these) ───────────────
    seo: {
        title:       { type: String },
        description: { type: String },
        ogImage:     { type: String },
    },

    // ── Draft (unpublished edits) ────────────────────────────────────────────
    // Editor writes here; "Publish" copies draft → live (theme/pages/nav/footer).
    // Kept as Mixed for now so the editor can evolve the shape without migrations.
    draft:        { type: mongoose.Schema.Types.Mixed },
    publishedAt:  { type: Date },
}, { timestamps: true });

schema.index({ "customDomain.hostname": 1 }, { unique: true, sparse: true });

export default PlatformDB.model("StorefrontSite", schema);
