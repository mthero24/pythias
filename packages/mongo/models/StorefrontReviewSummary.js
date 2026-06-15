import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// Cached per-product review rollup so product pages/cards/feeds read ratings cheaply.
// Recomputed whenever a review is published. AI summary is regenerated periodically.
const schema = new mongoose.Schema({
    orgId:     { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },

    avg:   { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    distribution: { 1: { type: Number, default: 0 }, 2: { type: Number, default: 0 }, 3: { type: Number, default: 0 }, 4: { type: Number, default: 0 }, 5: { type: Number, default: 0 } },

    // AI-summarized highlights (the "beat Shopify" bit).
    aiSummary: { type: String },
    aiPros:    { type: [String], default: [] },
    aiCons:    { type: [String], default: [] },
    aiAtCount: { type: Number, default: 0 },   // review count when AI summary was last generated
}, { timestamps: true });

schema.index({ orgId: 1, productId: 1 }, { unique: true });

export default PlatformDB.model("StorefrontReviewSummary", schema);
