import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection.js";

const schema = new mongoose.Schema({
    provider:   { type: String, default: "premierPrinting" },
    source:     { type: String, default: "" },   // route path, function name, cron job, etc.
    message:    { type: String, required: true },
    stack:      { type: String, default: "" },
    context:    { type: mongoose.Schema.Types.Mixed, default: {} }, // extra data (orderId, sku, etc.)
    userName:   { type: String, default: "" },
    email:      { type: String, default: "" },
    timestamp:  { type: Date, default: Date.now },
});

schema.index({ provider: 1, timestamp: -1 });
schema.index({ source: 1, timestamp: -1 });

export default PremierPrinting.model("ErrorLog", schema);
