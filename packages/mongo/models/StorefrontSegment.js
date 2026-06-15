import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// A reusable audience segment (rules over customer fields). Used to target campaigns and to
// filter automation flows. Resolved to a Mongo query at send time (lib/segments.js).
const Condition = new mongoose.Schema({
    // field ∈ emailConsent|smsConsent|isLead|emailVerified|ordersCount|totalSpentCents|lastOrderDaysAgo|signupDaysAgo|rewardsBalance
    field: { type: String, required: true },
    op:    { type: String, enum: ["is", "gte", "lte", "eq"], required: true },
    value: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

const schema = new mongoose.Schema({
    orgId:       { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name:        { type: String, required: true },
    description: { type: String },
    rules:       { match: { type: String, enum: ["all", "any"], default: "all" }, conditions: { type: [Condition], default: [] } },
}, { timestamps: true });

schema.index({ orgId: 1, createdAt: -1 });

export default PlatformDB.model("StorefrontSegment", schema);
