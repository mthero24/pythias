import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// Seller-set stock + reorder parameters per storefront product. Optional: products without
// a record are shown as "untracked" in the demand dashboard (forecast still computed). When
// `autoReorder` is on, the daily cron opens a restock task (and emails the supplier) once the
// product crosses its stockout-risk threshold.
const schema = new mongoose.Schema({
    orgId:     { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },

    onHand:      { type: Number, default: 0 },     // units in stock
    reorderPoint:{ type: Number, default: 0 },     // 0 = auto (avgDaily × (leadDays + safetyDays))
    leadDays:    { type: Number, default: 7 },     // supplier lead time
    safetyDays:  { type: Number, default: 3 },     // buffer beyond lead time
    supplierName:  { type: String, default: "" },
    supplierEmail: { type: String, default: "" },
    autoReorder:   { type: Boolean, default: false },
    lastReorderAt: { type: Date },
}, { timestamps: true });

schema.index({ orgId: 1, productId: 1 }, { unique: true });

export default PlatformDB.model("StorefrontInventory", schema);
