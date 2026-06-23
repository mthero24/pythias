import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// A marketing blast (email or SMS) the seller composes in the platform. On send it fans out
// into StorefrontMessage rows (one per recipient), staggered over time for reputation warmup.
const schema = new mongoose.Schema({
    orgId:   { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    channel: { type: String, enum: ["email", "sms"], required: true },
    name:    { type: String, required: true },

    // Audience: who (among opted-in, non-suppressed contacts) receives it.
    audience: { type: String, enum: ["all", "email_subscribers", "sms_subscribers", "customers", "leads", "segment"], default: "all" },
    segmentId: { type: mongoose.Schema.Types.ObjectId, ref: "StorefrontSegment" },   // when audience = "segment"

    subject: { type: String },   // email
    html:    { type: String },   // email body (AI-assisted or rendered from blocks)
    blocks:  { type: Array },    // email builder blocks ([{ type, ...props }]) — rendered to html via React Email
    body:    { type: String },   // sms body

    status:      { type: String, enum: ["draft", "scheduled", "sending", "sent", "canceled"], default: "draft", index: true },
    scheduledAt: { type: Date },     // when the fan-out starts
    sentAt:      { type: Date },

    stats: {
        recipients: { type: Number, default: 0 },
        queued:     { type: Number, default: 0 },
        sent:       { type: Number, default: 0 },
        failed:     { type: Number, default: 0 },
        skipped:    { type: Number, default: 0 },   // suppressed / not consented
    },

    createdBy: { type: String },   // platform user email
}, { timestamps: true });

schema.index({ orgId: 1, status: 1, createdAt: -1 });

export default PlatformDB.model("StorefrontCampaign", schema);
