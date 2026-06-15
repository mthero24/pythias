import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// One row per visitor session. The workhorse of storefront analytics: powers live-visitor
// counts, traffic/acquisition, landing & exit pages, the conversion funnel, and revenue —
// all by aggregating these over a date range (no heavyweight per-event storage needed).
const schema = new mongoose.Schema({
    orgId:     { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    sessionId: { type: String, required: true, unique: true },
    visitorId: { type: String, index: true },   // persistent across sessions (unique-visitor counts)

    startedAt:  { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    durationMs: { type: Number, default: 0 },

    landingPath:    { type: String },
    exitPath:       { type: String },
    referrer:       { type: String },
    referrerDomain: { type: String },   // "" = direct
    device:         { type: String, enum: ["mobile", "tablet", "desktop"], default: "desktop" },
    country:        { type: String },

    // Acquisition attribution (captured on the landing pageview).
    utmSource:   { type: String },
    utmMedium:   { type: String },
    utmCampaign: { type: String },
    returning:   { type: Boolean, default: false },   // this visitorId had an earlier session

    pageviews: { type: Number, default: 0 },

    // Funnel flags + outcome.
    addedToCart:    { type: Boolean, default: false },
    startedCheckout:{ type: Boolean, default: false },
    converted:      { type: Boolean, default: false },
    revenueCents:   { type: Number, default: 0 },
    orderId:        { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

schema.index({ orgId: 1, startedAt: -1 });
schema.index({ orgId: 1, lastSeenAt: -1 });   // live visitors

export default PlatformDB.model("StorefrontSession", schema);
