import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// A storefront gift card: a redeemable balance identified by a unique code. Issued by the
// seller (or, later, purchased on the storefront) and redeemed at checkout like store credit.
const schema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    code:  { type: String, required: true, uppercase: true, trim: true },

    initialCents: { type: Number, required: true },
    balanceCents: { type: Number, required: true },
    currency:     { type: String, default: "USD" },

    active:         { type: Boolean, default: true },
    recipientEmail: { type: String },
    purchaserEmail: { type: String },
    note:           { type: String },
    expiresAt:      { type: Date },

    // Ledger of redemptions for auditing.
    redemptions: [{ orderId: mongoose.Schema.Types.ObjectId, amountCents: Number, at: { type: Date, default: Date.now } }],
}, { timestamps: true });

schema.index({ orgId: 1, code: 1 }, { unique: true });

export default PlatformDB.model("StorefrontGiftCard", schema);
