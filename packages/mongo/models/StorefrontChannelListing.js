import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// Per-channel AI-optimized product copy. When syncing to a channel, the channel-specific title/
// description override the store defaults (each channel has different best practices). One row per
// (org, channel, product).
const schema = new mongoose.Schema({
    orgId:       { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    channel:     { type: String, required: true },
    productId:   { type: mongoose.Schema.Types.ObjectId, required: true },
    title:       { type: String },
    description: { type: String },
}, { timestamps: true });

schema.index({ orgId: 1, channel: 1, productId: 1 }, { unique: true });

export default PlatformDB.model("StorefrontChannelListing", schema);
