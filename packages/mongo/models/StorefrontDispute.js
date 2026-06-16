import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// Chargeback/dispute ledger for the Merchant-of-Record flow. Pythias is the MoR: disputes hit
// Pythias's Stripe account, we record + manage them here, and the seller is shielded (they see
// status but don't handle representment). On a lost dispute the order payout is clawed back.
const schema = new mongoose.Schema({
    orgId:           { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    orderId:         { type: mongoose.Schema.Types.ObjectId },
    poNumber:        { type: String },
    stripeDisputeId: { type: String, unique: true },
    chargeId:        { type: String },
    paymentIntentId: { type: String },
    amountCents:     { type: Number, default: 0 },
    currency:        { type: String, default: "usd" },
    reason:          { type: String },                 // fraudulent | product_not_received | ...
    status:          { type: String },                 // raw Stripe status
    state:           { type: String, enum: ["open", "won", "lost"], default: "open", index: true },
    customerEmail:   { type: String },
    openedAt:        { type: Date },
    dueBy:           { type: Date },
    resolvedAt:      { type: Date },
    payoutClawedBack:{ type: Boolean, default: false },
}, { timestamps: true });

export default PlatformDB.model("StorefrontDispute", schema);
