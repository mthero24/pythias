import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// A storefront collection (category page). Either a MANUAL pick of products, or a SMART
// collection auto-populated from product attributes via rules (the "beat" angle — AI can
// author the rules from a plain-English description).
const Condition = new mongoose.Schema({
    field: { type: String, enum: ["tag", "category", "brand", "title", "priceCents"], required: true },
    op:    { type: String, enum: ["contains", "eq", "lte", "gte"], required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
}, { _id: false });

const schema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    slug:  { type: String, required: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    seo:   { title: String, description: String },

    type:       { type: String, enum: ["manual", "smart"], default: "smart" },
    productIds: [{ type: mongoose.Schema.Types.ObjectId }],     // manual
    rules:      { match: { type: String, enum: ["all", "any"], default: "all" }, conditions: { type: [Condition], default: [] } },
    sort:       { type: String, enum: ["featured", "price-asc", "price-desc", "newest", "title"], default: "featured" },

    status:      { type: String, enum: ["draft", "published"], default: "draft", index: true },
    publishedAt: { type: Date },
    createdBy:   { type: String },
}, { timestamps: true });

schema.index({ orgId: 1, slug: 1 }, { unique: true });

export default PlatformDB.model("StorefrontCollection", schema);
