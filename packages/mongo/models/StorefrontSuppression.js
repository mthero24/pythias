import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// Per-org, per-channel opt-out / suppression list. Any unsubscribe, SMS STOP, or hard
// bounce lands here; campaign sends MUST check this before sending. Covers contacts that
// may not have a full account (newsletter/lead signups), keyed by the raw value.
const schema = new mongoose.Schema({
    orgId:   { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    channel: { type: String, enum: ["email", "sms", "push"], required: true },
    value:   { type: String, required: true, lowercase: true, trim: true }, // email address or phone (E.164)
    reason:  { type: String },   // "unsubscribe" | "stop" | "bounce" | "complaint"
    at:      { type: Date, default: Date.now },
}, { timestamps: true });

schema.index({ orgId: 1, channel: 1, value: 1 }, { unique: true });

export default PlatformDB.model("StorefrontSuppression", schema);
