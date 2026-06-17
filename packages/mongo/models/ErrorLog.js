import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection.js";

const schema = new mongoose.Schema({
    provider:    { type: String, default: "premierPrinting" },
    app:         { type: String, default: "" },   // which app emitted it (platform/premier/storefront)
    source:      { type: String, default: "" },   // route path, function name, cron job, etc.
    route:       { type: String, default: "" },   // request path (server errors)
    method:      { type: String, default: "" },   // GET/POST/…
    status:      { type: Number },                // HTTP status if known
    message:     { type: String, required: true },
    stack:       { type: String, default: "" },
    digest:      { type: String, default: "" },   // Next.js error digest
    context:     { type: mongoose.Schema.Types.Mixed, default: {} }, // sanitized extra data
    fingerprint: { type: String, default: "" },   // groups identical errors in the viewer
    orgId:       { type: String, default: "" },
    userName:    { type: String, default: "" },
    email:       { type: String, default: "" },
    timestamp:   { type: Date, default: Date.now },
});

schema.index({ provider: 1, timestamp: -1 });
schema.index({ source: 1, timestamp: -1 });
schema.index({ fingerprint: 1, timestamp: -1 });
// Auto-expire after 60 days so the collection can't grow unbounded.
schema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 60 });

export default PremierPrinting.model("ErrorLog", schema);
