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
}, { timestamps: true });

schema.index({ routedAt: -1 });
schema.index({ status: 1, acceptanceDeadline: 1 }); // for the fallback cron job

export default PlatformDB.model("RoutingLog", schema);
