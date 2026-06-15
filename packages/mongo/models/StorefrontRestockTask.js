import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// A reorder to action: created manually by the seller, by autopilot (one-click), or
// automatically by the daily cron (autoReorder products at stockout risk). The seller
// tracks it open → ordered → received.
const schema = new mongoose.Schema({
    orgId:     { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },
    title:     { type: String, default: "" },
    qty:       { type: Number, default: 0 },
    status:    { type: String, enum: ["open", "ordered", "received", "cancelled"], default: "open" },
    source:    { type: String, enum: ["manual", "autopilot", "auto"], default: "manual" },
    supplierEmail: { type: String, default: "" },
    supplierNotified: { type: Boolean, default: false },
    note:      { type: String, default: "" },
    createdBy: { type: String, default: "" },
}, { timestamps: true });

schema.index({ orgId: 1, status: 1, createdAt: -1 });
schema.index({ orgId: 1, productId: 1, status: 1 });

export default PlatformDB.model("StorefrontRestockTask", schema);
