import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// A storefront promo code. Created by the signup popup ("WELCOME10"), a campaign, or manually.
// Applied at checkout (validated server-side; never trust a client-sent amount).
const schema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    code:  { type: String, uppercase: true, trim: true },   // omitted for automatic discounts

    type:  { type: String, enum: ["percent", "fixed", "free_shipping"], required: true },
    value: { type: Number, default: 0 },             // percent (e.g. 10) or cents (e.g. 500); 0 for free_shipping

    // Automatic discounts apply with NO code when conditions are met (Shopify gates these).
    automatic:       { type: Boolean, default: false },
    title:           { type: String },               // shown to the buyer for automatic discounts

    active:          { type: Boolean, default: true },
    minSubtotalCents: { type: Number, default: 0 },
    maxUses:         { type: Number },               // null = unlimited
    usedCount:       { type: Number, default: 0 },
    perCustomerLimit: { type: Number },              // null = unlimited
    expiresAt:       { type: Date },
    source:          { type: String, enum: ["popup", "campaign", "manual"], default: "manual" },
}, { timestamps: true });

// One code per org (case-insensitive via uppercase). Partial so automatic (codeless) discounts
// don't collide on null.
schema.index({ orgId: 1, code: 1 }, { unique: true, partialFilterExpression: { code: { $type: "string" } } });
schema.index({ orgId: 1, automatic: 1, active: 1 });

export default PlatformDB.model("StorefrontDiscount", schema);
