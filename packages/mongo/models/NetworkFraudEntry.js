import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// NETWORK-WIDE shared fraud blocklist (no orgId scoping on the entry itself — that's the point:
// a bad actor flagged by one store protects every store). Identity values are stored HASHED for
// privacy; `masked` is a human-readable hint for dashboards. `reports[]` tracks which orgs flagged
// it. This is the cross-store protection a single-tenant platform (Shopify/Wix) structurally can't offer.
const schema = new mongoose.Schema({
    type:      { type: String, enum: ["email", "phone", "address", "ip"], required: true },
    valueHash: { type: String, required: true },        // sha256(normalized value)
    masked:    { type: String, default: "" },           // e.g. "jo***@gm***"
    severity:  { type: Number, default: 2 },            // 1 watch · 2 review · 3 block
    reason:    { type: String, default: "" },           // chargeback | manual | velocity
    reports:   [{ orgId: { type: mongoose.Schema.Types.ObjectId }, at: Date, reason: String }],
    hits:      { type: Number, default: 0 },            // times caught across the network
    active:    { type: Boolean, default: true },
    firstSeen: { type: Date, default: Date.now },
    lastSeen:  { type: Date, default: Date.now },
}, { timestamps: true });

schema.index({ type: 1, valueHash: 1 }, { unique: true });

export default PlatformDB.model("NetworkFraudEntry", schema);
