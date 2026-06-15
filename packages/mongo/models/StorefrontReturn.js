import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// A buyer-initiated return / exchange (RMA). Seller approves, then it resolves to a Stripe
// refund, store credit (rewards), or a provider-routed replacement order.
const ReturnItem = new mongoose.Schema({
    productId:  { type: mongoose.Schema.Types.ObjectId },
    styleCode:  String, colorName: String, sizeName: String,
    qty:        { type: Number, default: 1 },
    reason:     { type: String },   // "wrong_size" | "defective" | "not_as_described" | "changed_mind" | "arrived_late" | "other"
}, { _id: false });

const schema = new mongoose.Schema({
    orgId:      { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    orderId:    { type: mongoose.Schema.Types.ObjectId, required: true },
    poNumber:   { type: String },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "StorefrontCustomer" },
    customerEmail: { type: String },

    rmaNumber:  { type: String, required: true, unique: true },
    items:      { type: [ReturnItem], default: [] },
    resolution: { type: String, enum: ["refund", "store_credit", "exchange"], default: "refund" },

    // requested → approved/rejected → received → (refunded|credited|exchanged) → completed
    status:     { type: String, enum: ["requested", "approved", "rejected", "received", "refunded", "credited", "exchanged", "completed"], default: "requested", index: true },

    refundCents:        { type: Number, default: 0 },
    creditCents:        { type: Number, default: 0 },
    replacementOrderId: { type: mongoose.Schema.Types.ObjectId },
    stripeRefundId:     { type: String },

    note:       { type: String },   // buyer
    sellerNote: { type: String },
}, { timestamps: true });

schema.index({ orgId: 1, status: 1, createdAt: -1 });
schema.index({ orgId: 1, customerId: 1 });

export default PlatformDB.model("StorefrontReturn", schema);
