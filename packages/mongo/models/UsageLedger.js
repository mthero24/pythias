import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    period: { type: String, required: true },      // 'YYYY-MM'
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date },
    orders: { type: Number, default: 0 },
    overageOrders: { type: Number, default: 0 },
    overageOrdersCharge: { type: Number, default: 0 },
    products: { type: Number, default: 0 },
    overageProductsCharge: { type: Number, default: 0 },
    designs: { type: Number, default: 0 },
    overageDesignsCharge: { type: Number, default: 0 },
    extraUsers: { type: Number, default: 0 },
    extraUsersCharge: { type: Number, default: 0 },
    // Storefront marketing — billed per email block + per SMS block sent.
    emailsSent: { type: Number, default: 0 },
    overageEmailsCharge: { type: Number, default: 0 },
    smsSent: { type: Number, default: 0 },
    overageSmsCharge: { type: Number, default: 0 },
    totalOverageCharge: { type: Number, default: 0 },
    invoiced: { type: Boolean, default: false },
    stripeInvoiceId: { type: String },
    marketingBilled: { type: Boolean, default: false },   // email/SMS overage invoice-item created for this period
    marketingInvoiceItemId: { type: String },
    alerts: [{
        type: { type: String, enum: ['75pct', '90pct', '100pct'] },
        resource: { type: String },
        sentAt: { type: Date },
    }],
}, { timestamps: true });

schema.index({ orgId: 1, period: 1 }, { unique: true });

export default PlatformDB.model("UsageLedger", schema);
