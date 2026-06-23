import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// A marketing automation: a trigger + an ordered series of timed messages. When the trigger
// fires for a customer (optionally within a segment), the steps are enqueued into the outbox
// at staggered times. Idempotent via per-(flow,customer,enrollment,step) dedupe keys.
const Step = new mongoose.Schema({
    delayHours: { type: Number, default: 0 },   // after enrollment (cumulative handled at enroll time)
    channel:    { type: String, enum: ["email", "sms"], default: "email" },
    subject:    { type: String },   // email
    html:       { type: String },   // email (raw, or rendered from blocks)
    blocks:     { type: Array },    // email builder blocks → rendered via React Email
    body:       { type: String },   // sms
}, { _id: false });

const schema = new mongoose.Schema({
    orgId:   { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name:    { type: String, required: true },
    // What enrolls a customer.
    trigger: { type: String, enum: ["signup", "first_purchase", "any_purchase", "abandoned_cart", "win_back"], required: true },
    active:  { type: Boolean, default: false },
    segmentId: { type: mongoose.Schema.Types.ObjectId, ref: "StorefrontSegment" },   // optional audience filter

    steps:   { type: [Step], default: [] },
    stats:   { enrolled: { type: Number, default: 0 } },
}, { timestamps: true });

schema.index({ orgId: 1, trigger: 1, active: 1 });

export default PlatformDB.model("StorefrontFlow", schema);
