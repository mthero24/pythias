import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// Per-(org, day, path) rollup: pageview counts + Core Web Vitals sums. Keeps "top pages" and
// per-page page-speed cheap to read and bounded in size (paths × days), without storing every
// raw pageview. Averages = sum / count.
const schema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    date:  { type: String, required: true },   // YYYY-MM-DD (UTC)
    path:  { type: String, required: true },

    views: { type: Number, default: 0 },

    // Web Vitals — sums + counts (ms, except CLS which is unitless ×1000-friendly).
    lcpSum: { type: Number, default: 0 }, lcpCount: { type: Number, default: 0 },   // Largest Contentful Paint
    clsSum: { type: Number, default: 0 }, clsCount: { type: Number, default: 0 },   // Cumulative Layout Shift
    fcpSum: { type: Number, default: 0 }, fcpCount: { type: Number, default: 0 },   // First Contentful Paint
    ttfbSum:{ type: Number, default: 0 }, ttfbCount:{ type: Number, default: 0 },   // Time To First Byte
    inpSum: { type: Number, default: 0 }, inpCount: { type: Number, default: 0 },   // Interaction to Next Paint
}, { timestamps: true });

schema.index({ orgId: 1, date: 1, path: 1 }, { unique: true });
schema.index({ orgId: 1, date: 1 });

export default PlatformDB.model("StorefrontPathStat", schema);
