import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// A pending checkout, created when a PaymentIntent is opened. The webhook looks this up
// on payment success and turns it into a real order (the cart is too big for PI metadata).
const schema = new mongoose.Schema({
    orgId:           { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    customerId:      { type: mongoose.Schema.Types.ObjectId, ref: "StorefrontCustomer" }, // null for guest
    items:           { type: mongoose.Schema.Types.Mixed, default: [] },  // [{productId,sku,qty}]
    shippingAddress: { type: mongoose.Schema.Types.Mixed },
    email:           { type: String },
    redeemCents:     { type: Number, default: 0 },
    promoCode:       { type: String },
    giftCardCode:    { type: String },
    taxCents:        { type: Number, default: 0 },
    taxCalcId:       { type: String },   // Stripe Tax calculation id → recorded as a transaction on success
    amountCents:     { type: Number, required: true },
    paymentIntentId: { type: String, index: true },
    status:          { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    orderId:         { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
}, { timestamps: true });

export default PlatformDB.model("StorefrontCheckoutSession", schema);
