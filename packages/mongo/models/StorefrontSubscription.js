import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// A recurring "subscribe & save" order. Self-managed billing: a cron charges the saved card
// off-session each cycle and places a routed fulfillment order (reusing the order pipeline).
const schema = new mongoose.Schema({
    orgId:      { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "StorefrontCustomer", required: true },
    customerEmail: { type: String },

    items:           { type: mongoose.Schema.Types.Mixed, default: [] },   // [{productId,sku,qty}]
    shippingAddress: { type: mongoose.Schema.Types.Mixed },
    intervalDays:    { type: Number, default: 30 },
    intervalLabel:   { type: String },
    discountPercent: { type: Number, default: 0 },

    stripeCustomerId:      { type: String },
    stripePaymentMethodId: { type: String },

    status:        { type: String, enum: ["active", "paused", "canceled"], default: "active", index: true },
    nextBillingAt: { type: Date, index: true },
    lastOrderId:   { type: mongoose.Schema.Types.ObjectId },
    cyclesBilled:  { type: Number, default: 0 },
    failedAttempts: { type: Number, default: 0 },
}, { timestamps: true });

schema.index({ status: 1, nextBillingAt: 1 });

export default PlatformDB.model("StorefrontSubscription", schema);
