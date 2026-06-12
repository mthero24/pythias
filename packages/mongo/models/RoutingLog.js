import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// Audit trail for every routing decision.
// Every Commerce Cloud order that gets routed creates one of these.
const schema = new mongoose.Schema({
    orderId:            { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    commerceOrgId:      { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    selectedProviderId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
    // All providers considered with their scores and why they were accepted/rejected
    candidates: [{
        providerId:    { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
        geoScore:      { type: Number },
        priceScore:    { type: Number },
        reliabilityScore: { type: Number },
        totalScore:    { type: Number },
        rejected:      { type: Boolean, default: false },
        rejectedReason: { type: String }, // "capacity", "missing_skus", "declined", "timeout"
    }],
    status: {
        type: String,
        enum: ["routed", "accepted", "declined", "unroutable", "cancelled"],
        default: "routed",
        index: true,
    },
    fallbackCount:      { type: Number, default: 0 },   // how many providers rejected before acceptance
    acceptanceDeadline: { type: Date },                  // 2-hour window from routedAt
    routingVersion:     { type: String, default: "1.0.0" },
    isSplit:            { type: Boolean, default: false }, // true if order was split across multiple providers
    routedAt:           { type: Date, default: Date.now },
    acceptedAt:         { type: Date },
    totalWholesaleCost: { type: Number },                // USD cents — what was charged to the Commerce Cloud wallet
    // Handoff to the provider's production system (e.g. Premier's floor)
    handoffStatus:      { type: String, enum: ["pending", "sent", "failed", "skipped"], default: "pending" },
    handoffAt:          { type: Date },
    handoffError:       { type: String },
    providerOrderId:    { type: String },                // the order id created in the provider's own system
    // ── Fulfillment status synced back from the provider ──────────────────────
    fulfillmentStatus:  { type: String, enum: ["received", "in_production", "shipped", "delivered", "cancelled"], default: "received" },
    trackingNumber:     { type: String },
    carrier:            { type: String },
    shippedAt:          { type: Date },
    deliveredAt:        { type: Date },
    // ── Money (USD cents). Wholesale is charged at routing; shipping+handling at ship ──
    providerShippingPaid: { type: Number, default: 0 },  // actual label cost reimbursed to provider
    providerHandlingFee:  { type: Number, default: 0 },  // handling fee credited to provider
    platformFee:          { type: Number, default: 0 },  // platform's cut of wholesale
    providerOwed:         { type: Number, default: 0 },  // wholesale + shipping + handling − platformFee, accrued for payout
    settledAt:            { type: Date },                 // when ship-time settlement ran
}, { timestamps: true });

schema.index({ routedAt: -1 });
schema.index({ status: 1, acceptanceDeadline: 1 }); // for the fallback cron job

export default PlatformDB.model("RoutingLog", schema);
