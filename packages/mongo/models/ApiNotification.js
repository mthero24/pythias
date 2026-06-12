import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

// Operational notifications for the Partner API — surfaced in the API dashboard.
// Records failures (and notable events) so org users can see what went wrong and why.
const schema = new mongoose.Schema({
    orgId:   { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    level:   { type: String, enum: ["error", "warning", "info"], default: "error" },
    // where it originated, e.g. "order.create" | "order.route" | "webhook" | "product.upsert" | "design.upsert"
    source:  { type: String, required: true },
    event:   { type: String },                 // related webhook/event name, if any
    title:   { type: String, required: true }, // short headline
    message: { type: String },                 // why it failed (human readable)
    detail:  { type: Object },                 // structured context: { skus, statusCode, endpoint, orderId, poNumber, url }
    read:    { type: Boolean, default: false },
}, { timestamps: true });

schema.index({ orgId: 1, createdAt: -1 });
schema.index({ orgId: 1, read: 1 });

export default PremierPrinting.model("ApiNotification", schema, "api_notifications");
