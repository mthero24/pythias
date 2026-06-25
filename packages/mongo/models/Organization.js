import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // "fulfillment" = Fulfillment Cloud (has own production floor)
    // "commerce"    = Commerce Cloud (orders routed to fulfillment providers)
    // "storefront"  = Storefront Cloud (standalone storefront; seller self-fulfills / exports orders to their own systems)
    orgType: { type: String, enum: ["fulfillment", "commerce", "storefront"], default: "fulfillment" },
    // Founding member (podcast/early-bird cohort) — flagged at signup so the coupon can be applied.
    // Tier is decided by signup order: founder = first 10 (25% off for life + free onboarding),
    // early_bird = slots 11-60 (20% off/yr + 50% off onboarding), early_year = slots 61-100 (10% off/yr).
    founder: { type: Boolean, default: false },
    foundingTier: { type: String, enum: ["founder", "early_bird", "early_year"] },
    foundingSignupAt: { type: Date },
    tier: {
        type: String,
        // Fulfillment Cloud: starter, professional, business, scale, enterprise
        // Commerce Cloud:    free, launch, growth, scale, enterprise
        enum: ['starter', 'professional', 'business', 'free', 'launch', 'growth', 'scale', 'enterprise'],
        default: 'starter',
    },
    status: {
        type: String,
        enum: ['trial', 'active', 'suspended', 'cancelled'],
        default: 'trial',
    },
    billingEmail: { type: String },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    // Comp account: free SaaS subscription (no Stripe sub / no monthly tier billing).
    // Fulfillment is still paid normally — the wallet is charged for wholesale/shipping/handling.
    comp: { type: Boolean, default: false },
    // Storefront marketplace payouts — the seller's Stripe Connect Express account (on the
    // SEPARATE marketplace Stripe account). Pythias collects buyer payments + transfers net here.
    storefrontConnect: {
        accountId:   { type: String },   // acct_...
        status:      { type: String, enum: ["none", "pending", "active"], default: "none" },
        onboardedAt: { type: Date },
    },
    // snapshot of current limits — set from TIERS on tier change
    limits: {
        ordersPerMonth: { type: Number, default: 500 },
        products: { type: Number, default: 250 },
        designs: { type: Number, default: 100 },
        integrations: { type: Number, default: 2 },
        users: { type: Number, default: 5 },
    },
    enabledIntegrations: [{ type: String }],
    // fast-check usage counters (authoritative source is UsageLedger)
    usage: {
        periodStart: { type: Date, default: Date.now },
        ordersThisMonth: { type: Number, default: 0 },
        productsTotal: { type: Number, default: 0 },
        designsTotal: { type: Number, default: 0 },
        usersTotal: { type: Number, default: 0 },
    },
    settings: {
        timezone: { type: String, default: 'America/New_York' },
        logoUrl: { type: String },
        primaryColor: { type: String },
        bulkThreshold: { type: Number, default: 5 },
        skuFormat: {
            parts: { type: [String], default: ["blank.code", "color.sku", "size.sku", "design.sku"] },
            separator: { type: String, default: "_" },
        },
        gs1: {
            apiKey: { type: String },
            secondaryKey: { type: String },
            accountNumber: { type: String },
        },
    },
    // Return/from address printed on shipping labels for this org's orders.
    // For Commerce Cloud, the provider (e.g. Premier) ships blind under this address.
    returnAddress: {
        name:         { type: String },   // contact / person
        businessName: { type: String },   // brand shown on the label
        address:      { type: String },
        address2:     { type: String },
        city:         { type: String },
        state:        { type: String },
        postalCode:   { type: String },
        country:      { type: String, default: "US" },
    },
    // ── Commerce Cloud wallet ──────────────────────────────────────
    wallet: {
        balance:              { type: Number, default: 0 },       // USD cents
        minimumBalance:       { type: Number, default: 20000 },   // $200 default floor
        autoRechargeAmount:   { type: Number, default: 50000 },   // amount added on auto-recharge
        autoRechargeEnabled:  { type: Boolean, default: false },
        stripePaymentMethodId: { type: String },
        lastRechargedAt:      { type: Date },
    },
    // ── Self-ship shipping labels (Phase 2 upgrade) ───────────────────
    // Sellers who stock + ship their own catalog products can buy discounted carrier labels in-app
    // (usage-based: carrier cost + a small per-label spread, charged to the wallet). Ship-from uses
    // returnAddress. defaultParcel seeds the parcel when an order's item weights are unknown.
    shippingLabels: {
        enabled: { type: Boolean, default: false },
        defaultParcel: {
            length: { type: Number, default: 6 },   // inches
            width:  { type: Number, default: 4 },
            height: { type: Number, default: 4 },
            weight: { type: Number, default: 8 },    // ounces (fallback when items have no weight)
        },
    },
    // ── Auto-reorder (Phase 3) — opt-in scheduled restock of low catalog stock ─────────
    // When enabled, a daily cron sweeps this org's CJ-sourced catalog variants and restocks any
    // at/below their reorder point (charged to the wallet, same as a manual reorder).
    autoReorder: {
        enabled:   { type: Boolean, default: false },
        lastRunAt: { type: Date },
    },
    // ── Auto-dropship (Phase 3) — opt-in: supplier ships CJ-sourced catalog items straight to the
    // buyer when an order is placed (purchased + shipped per order, charged to the wallet; no stock held).
    autoDropship: {
        enabled: { type: Boolean, default: false },
    },
    // ── Partner API / webhook settings ───────────────────────────────
    partnerWebhook: {
        url:       { type: String },           // partner's endpoint Pythias POSTs to
        secret:    { type: String },           // HMAC-SHA256 signing secret (shown once)
        active:    { type: Boolean, default: false },
        events:    { type: [String], default: ["order.routed", "order.cancelled"] },
    },
    // ── Terms of service acceptance ───────────────────────────────────
    termsAccepted: {
        platform: {
            acceptedAt: { type: Date },
            version:    { type: String },
            ip:         { type: String },
        },
        fulfillmentPartner: {
            acceptedAt: { type: Date },
            version:    { type: String },
            ip:         { type: String },
        },
    },
    // ── Fulfillment partner eligibility ───────────────────────────────
    fulfillmentPartner: {
        eligible:          { type: Boolean, default: false },  // auto-set when criteria met
        offered:           { type: Boolean, default: false },  // Pythias admin offered them
        offeredAt:         { type: Date },
        accepted:          { type: Boolean, default: false },  // org accepted the offer
        acceptedAt:        { type: Date },
        avgShipDays30d:    { type: Number },                   // rolling avg, updated nightly
        lastCheckedAt:     { type: Date },
        platformFeePercent: { type: Number, default: 2 },      // % of wholesale order value Pythias keeps (1–3%)
    },
    trialEndsAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

schema.index({ slug: 1 });
schema.index({ stripeCustomerId: 1 });

export default PlatformDB.model("Organization", schema);
