import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    date: { type: Date, default: Date.now },
    pieceId: { type: String, required: true },
    poNumber: String,
    shippingType: { type: String, default: "Standard" },
    description: String,
    name: String,
    status: { type: String, required: true },
    steps: [{ status: String, date: Date }],
    order: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformOrder" },
    orderId: { type: String },
    blank: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformBlank" },
    designRef: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformDesign" },
    designSku: { type: String },
    sizeName: String,
    styleCode: String,
    colorName: String,
    type: String,
    price: Number,
    paid: { type: Boolean, default: false },
    labelPrinted: { type: Boolean, default: false },
    labelPrintedDates: [{ type: Date }],
    treated: { type: Boolean, default: false },
    printed: { type: Boolean, default: false },
    frontPrinted: { type: Boolean, default: false },
    backPrinted: { type: Boolean, default: false },
    folded: { type: Boolean, default: false },
    shipped: { type: Boolean, default: false },
    cancelled: { type: Boolean, default: false },
    repull: { type: Boolean, default: false },
    isBlank: { type: Boolean, default: false },
    upc: String,
    sku: String,
    marketplace: String,
    bin: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformBin" },
    productionNotes: String,
    bulkId: String,
    stockStatus: { type: String, default: "inStock" },
}, { timestamps: true });

schema.index({ orgId: 1, pieceId: 1 }, { unique: true });
schema.index({ orgId: 1, status: 1 });
schema.index({ orgId: 1, order: 1 });

export default PlatformDB.model("PlatformItem", schema);
