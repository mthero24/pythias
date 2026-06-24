import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// A storefront's CUSTOMER (the seller's buyer). Org-scoped — a customer of brand A is
// distinct from brand B. Shared across the web storefront AND that brand's white-label
// app (same account, token auth). Holds marketing consent (provable, per-channel),
// the rewards balance, and a link to the Stripe Customer for saved cards.

// Per-channel marketing consent. marketing ≠ transactional (order updates always allowed).
// Store the exact opt-in wording (`text`) + when/where/IP as proof (TCPA/CAN-SPAM/GDPR).
const Consent = new mongoose.Schema({
    optedIn:       { type: Boolean, default: false },
    at:            { type: Date },
    source:        { type: String },   // e.g. "signup", "checkout", "newsletter"
    ip:            { type: String },
    text:          { type: String },   // exact opt-in copy shown (+ version)
    doubleOptInAt: { type: Date },     // email only (optional)
}, { _id: false });

const Address = new mongoose.Schema({
    name: String, line1: String, line2: String, city: String,
    state: String, postalCode: String, country: { type: String, default: "US" },
    phone: String, isDefault: { type: Boolean, default: false },
}, { _id: true });

// A saved cart / save-for-later line. Stores enough to rehydrate the cart on another device
// without re-fetching the product (price is re-validated at checkout regardless).
const CartLine = new mongoose.Schema({
    productId:  String,
    sku:        String,
    qty:        Number,
    title:      String,
    image:      String,
    color:      String,
    size:       String,
    priceCents: Number,
    addedAt:    { type: Date, default: Date.now },
}, { _id: false });

const schema = new mongoose.Schema({
    orgId:        { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    email:        { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String },          // null for guest/social later
    name:         { type: String },
    phone:        { type: String },
    addresses:    { type: [Address], default: [] },

    stripeCustomerId: { type: String },      // saved payment methods
    rewardsBalance:   { type: Number, default: 0 },   // reward dollars (cents)

    // Expo push tokens for the white-label mobile app (one per device the buyer logs in on).
    pushTokens: { type: [{ token: String, platform: String, updatedAt: Date }], default: [] },

    // A "lead" is a popup/newsletter signup with no password yet (can be claimed later by signup).
    isLead:            { type: Boolean, default: false },
    emailVerified:     { type: Boolean, default: false },
    emailVerifyToken:  { type: String },
    emailVerifyExpires: { type: Date },

    // Lifecycle tracking for abandoned-cart / abandoned-session nudges.
    lastSeenAt:           { type: Date },
    abandonedCartSentAt:  { type: Date },
    abandonedSessionSentAt: { type: Date },

    // Order stats (maintained at checkout) — power segments + win-back automations.
    ordersCount:    { type: Number, default: 0 },
    totalSpentCents: { type: Number, default: 0 },
    lastOrderAt:    { type: Date },
    winBackSentAt:  { type: Date },

    // Persisted cart + save-for-later, so the basket follows the buyer across devices/apps.
    cart:          { type: [CartLine], default: [] },
    savedForLater: { type: [CartLine], default: [] },
    favorites:     { type: [CartLine], default: [] },   // wishlist (product-level; qty unused)
    cartUpdatedAt: { type: Date },

    // Reusable "create your own" image library (uploaded + AI art), so it follows the buyer across visits.
    designUploads: { type: [String], default: [] },

    marketingConsent: {
        email: { type: Consent, default: () => ({}) },
        sms:   { type: Consent, default: () => ({}) },
        push:  { type: Consent, default: () => ({}) },   // mobile app push channel
    },

    lastLoginAt: { type: Date },
}, { timestamps: true });

// One account per email per storefront (org).
schema.index({ orgId: 1, email: 1 }, { unique: true });

export default PlatformDB.model("StorefrontCustomer", schema);
