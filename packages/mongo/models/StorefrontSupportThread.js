import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// A support/contact conversation between a storefront CUSTOMER and the SELLER. Started
// from the buyer's account ("contact us"); the seller replies from the platform later.
// Org-scoped; optionally tied to a specific order.
const Message = new mongoose.Schema({
    from: { type: String, enum: ["customer", "seller"], required: true },
    body: { type: String, required: true },
    at:   { type: Date, default: Date.now },
}, { _id: true });

const schema = new mongoose.Schema({
    orgId:      { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "StorefrontCustomer", required: true, index: true },
    orderId:    { type: mongoose.Schema.Types.ObjectId, ref: "Order" },   // optional context
    subject:    { type: String, default: "" },
    status:     { type: String, enum: ["open", "closed"], default: "open" },
    messages:   { type: [Message], default: [] },
    lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

schema.index({ orgId: 1, customerId: 1, lastMessageAt: -1 });

export default PlatformDB.model("StorefrontSupportThread", schema);
