import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// TRUE received monies — one row per actual payment Pythias collected from a seller (Stripe).
// Written by the billing webhook on invoice.paid / checkout.session.completed. This is the
// authoritative source for "what the seller actually paid" (platform cost) + company finance.
// NOT projected MRR, NOT pending/upcoming charges — only money that cleared.
const schema = new mongoose.Schema({
    orgId:           { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    amountCents:     { type: Number, required: true },          // Stripe amount_paid (what actually cleared)
    currency:        { type: String, default: "usd" },
    // subscription = base tier fee, overage = usage above tier, kling = AI video, onboarding = setup fee,
    // wallet = Commerce Cloud prepaid top-up (received but earmarked for fulfillment, NOT platform revenue).
    type:            { type: String, enum: ["subscription", "overage", "kling", "onboarding", "wallet", "other"], default: "other" },
    period:          { type: String },                          // 'YYYY-MM' (invoice billing period, when applicable)
    stripeInvoiceId: { type: String },
    stripeSessionId: { type: String },
    description:     { type: String },
    paidAt:          { type: Date, required: true },
}, { timestamps: true });

schema.index({ orgId: 1, paidAt: -1 });
schema.index({ paidAt: -1 });
schema.index({ stripeInvoiceId: 1 }, { unique: true, sparse: true });
schema.index({ stripeSessionId: 1 }, { unique: true, sparse: true });

export default PlatformDB.model("PaymentReceived", schema);
