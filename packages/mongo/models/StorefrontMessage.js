import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// Unified outbox for every storefront email/SMS — transactional (verification, welcome, order
// confirmation/status) AND marketing (campaigns, abandoned cart/session). Everything enqueues
// here; a throttled drain sends them, which gives one place for: slow warmup sending (build
// sender reputation), retries, suppression checks at send time, and per-block billing.
const schema = new mongoose.Schema({
    orgId:      { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    channel:    { type: String, enum: ["email", "sms"], required: true },
    to:         { type: String, required: true },               // email address or E.164 phone
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "StorefrontCustomer" },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "StorefrontCampaign" },

    type: {
        type: String,
        enum: ["verification", "welcome", "order_confirmation", "order_status", "abandoned_cart", "abandoned_session", "campaign"],
        required: true,
    },
    // Consent + suppression only gate "marketing"; "transactional" always sends.
    category: { type: String, enum: ["transactional", "marketing"], required: true },

    subject: { type: String },   // email
    html:    { type: String },   // email
    body:    { type: String },   // sms

    status:      { type: String, enum: ["queued", "sent", "failed", "skipped", "canceled"], default: "queued", index: true },
    scheduledAt: { type: Date, default: Date.now },   // drain only picks queued && scheduledAt <= now
    sentAt:      { type: Date },
    attempts:    { type: Number, default: 0 },
    error:       { type: String },
    providerId:  { type: String },   // Resend/Twilio message id

    // Idempotency — e.g. "welcome:<custId>", "order_confirmation:<orderId>". Unique+sparse so a
    // re-trigger never double-sends a transactional message.
    dedupeKey: { type: String },
}, { timestamps: true });

// Drain query: queued messages whose time has come, oldest first.
schema.index({ status: 1, scheduledAt: 1 });
schema.index({ dedupeKey: 1 }, { unique: true, sparse: true });

export default PlatformDB.model("StorefrontMessage", schema);
