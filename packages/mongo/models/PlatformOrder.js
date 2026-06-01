import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    date: { type: Date, default: Date.now },
    bulk: { type: Boolean, default: false },
    bulkPrinted: { type: Boolean, default: false },
    total: Number,
    productCost: Number,
    shippingCost: Number,
    discountAmount: { type: Number, default: 0 },
    status: { type: String, required: true },
    poNumber: { type: String, required: true },
    orderId: { type: String, required: true },
    orderKey: String,
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "PlatformItem" }],
    shippingAddress: {
        name: String, phone: String, address1: String, address2: String,
        city: String, state: String, country: String, zip: String,
    },
    shippingType: { type: String, required: true },
    marketplace: { type: String },
    brandName: { type: String },
    marketplaceOrderId: { type: String },
    marketplaceShipped: { type: Boolean, default: false },
    notes: [{ note: String, user: String, date: { type: Date, default: Date.now } }],
    shippingInfo: {
        label: String,
        labels: [{ trackingNumber: String, labelData: String, carrier: String }],
        trackingNumber: String,
        carrier: String,
        serviceCode: String,
    },
    shipped: { type: Boolean, default: false },
    preShipped: { type: Boolean, default: false },
    cancelled: { type: Boolean, default: false },
    repulled: { type: Boolean, default: false },
    repullCount: { type: Number, default: 0 },
    batch: { type: mongoose.Schema.Types.ObjectId },
    giftMessage: String,
    requestedDeliveryDate: Date,
}, { timestamps: true });

schema.index({ orgId: 1, status: 1 });
schema.index({ orgId: 1, orderId: 1 }, { unique: true });
schema.index({ orgId: 1, poNumber: 1 });

export default PlatformDB.model("PlatformOrder", schema);
