import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// Real-time intake controls per provider.
// Routing engine checks these before scoring — a paused or capped
// provider is skipped entirely regardless of score.
const schema = new mongoose.Schema({
    providerId:        { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, unique: true },
    maxDailyOrders:    { type: Number, default: 500 },          // hard cap — routing skips when hit
    currentDailyCount: { type: Number, default: 0 },            // resets at midnight provider local time
    lastResetDate:     { type: String },                         // ISO date string of last midnight reset
    isPaused:          { type: Boolean, default: false },        // provider can pause intake entirely
    pauseUntil:        { type: Date },                           // auto-resume at this date if set
    warmupMode:        { type: Boolean, default: true },         // new providers capped at 50 composite pts
    // Controls whether this provider accepts Commerce Cloud orders
    acceptsCommerceCloud: { type: Boolean, default: false },
    // Internal providers (Premier, PO) skip the 2-hour acceptance window and auto-accept immediately
    autoAccept:        { type: Boolean, default: false },
    // Per-order handling fee this provider charges (USD cents). Flat for now; later
    // providers set their own and the routing engine filters out fees above the seller's max.
    handlingFee:       { type: Number, default: 200 },
    // Controls whether this Fulfillment Cloud customer accepts overflow orders from other providers
    allowOverflowIn:   { type: Boolean, default: false },
    // Controls whether this Fulfillment Cloud customer can send overflow orders out
    allowOverflowOut:  { type: Boolean, default: false },
    // Threshold that triggers auto overflow-out: multiplier of average daily volume
    overflowThreshold: { type: Number, default: 2 },
    // ── Seller-as-supplier KYC gate ──────────────────────────────────────────
    // A seller enrolling as a network fulfiller must pass KYC before orders route to them.
    // Until verified, acceptsCommerceCloud stays false so the routing engine skips them.
    kycStatus: { type: String, enum: ["none", "submitted", "verified", "rejected"], default: "none" },
    kyc: {
        legalName:    { type: String },
        taxId:        { type: String },   // EIN / SSN — store minimally
        businessType: { type: String },
        address:      { type: String },
        contactEmail: { type: String },
        submittedAt:  { type: Date },
        reviewedAt:   { type: Date },
        reason:       { type: String },   // rejection reason
    },
}, { timestamps: true });

export default PlatformDB.model("ProviderCapacity", schema);
