import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// Append-only audit of every reward-balance change for a storefront customer.
// The running balance lives on StorefrontCustomer.rewardsBalance; this is the proof.
const schema = new mongoose.Schema({
    orgId:       { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    customerId:  { type: mongoose.Schema.Types.ObjectId, ref: "StorefrontCustomer", required: true, index: true },
    type:        { type: String, enum: ["signup", "earn", "redeem", "adjust"], required: true },
    amountCents: { type: Number, required: true },   // signed: + for earn/signup, − for redeem
    balanceAfter:{ type: Number },                   // balance after applying this entry (cents)
    orderId:     { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    note:        { type: String },
    at:          { type: Date, default: Date.now },
}, { timestamps: true });

schema.index({ orgId: 1, customerId: 1, at: -1 });

export default PlatformDB.model("RewardLedger", schema);
