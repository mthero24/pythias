import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// NETWORK-WIDE deliverability suppression: a hard bounce or spam complaint on any store
// suppresses that recipient across the WHOLE network, protecting the shared warmed sender pool.
// (Per-store opt-outs/unsubscribes stay per-store in StorefrontSuppression — legal + intentional.)
const schema = new mongoose.Schema({
    channel:   { type: String, enum: ["email", "sms"], required: true },
    valueHash: { type: String, required: true },        // sha256(normalized address/phone)
    masked:    { type: String, default: "" },
    reason:    { type: String, default: "bounce" },     // bounce | complaint | manual
    reports:   [{ orgId: { type: mongoose.Schema.Types.ObjectId }, at: Date }],
    hits:      { type: Number, default: 0 },
    firstSeen: { type: Date, default: Date.now },
    lastSeen:  { type: Date, default: Date.now },
}, { timestamps: true });

schema.index({ channel: 1, valueHash: 1 }, { unique: true });

export default PlatformDB.model("NetworkSuppression", schema);
