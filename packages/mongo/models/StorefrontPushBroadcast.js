import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// A broadcast push notification the seller sends to their white-label mobile app's users
// (the buyers who installed the app and granted OS-level push permission — i.e. registered an
// Expo push token on StorefrontCustomer.pushTokens). Org-scoped; one row per "Send now", kept
// for a simple recent-sends history. Sending is synchronous (Expo fan-out, batched 100), so the
// recipient/sent counts are captured at send time.
const schema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },

    title: { type: String, required: true },   // push title
    body:  { type: String, required: true },    // push message
    url:   { type: String },                    // optional deep-link target (data.url)

    recipients: { type: Number, default: 0 },   // distinct app users we targeted (had ≥1 token)
    sentCount:  { type: Number, default: 0 },    // Expo push messages dispatched (one per token)

    // Audience segment (see @pythias/mongo pushSegmentFilter) — which app users this targets.
    segment: { type: String, default: "all" },

    // Scheduling: when set + status "scheduled", the hourly storefront cron dispatches it at/after
    // this time (re-resolving the segment audience fresh). Immediate "Send now" leaves this unset.
    scheduledAt: { type: Date },
    status: { type: String, enum: ["sent", "scheduled", "canceled"], default: "sent" },

    createdBy: { type: String },   // platform user email
}, { timestamps: true });

schema.index({ orgId: 1, createdAt: -1 });
// Cron pickup: due scheduled broadcasts (any org).
schema.index({ status: 1, scheduledAt: 1 });

export default PlatformDB.model("StorefrontPushBroadcast", schema);
