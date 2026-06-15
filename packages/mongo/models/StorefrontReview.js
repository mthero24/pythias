import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// A product review left by a storefront buyer. Verified-buyer detection (the reviewer actually
// ordered the product) + photos + a seller reply. AI sentiment/tags are filled in on publish.
const schema = new mongoose.Schema({
    orgId:      { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    productId:  { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "StorefrontCustomer" },
    orderId:    { type: mongoose.Schema.Types.ObjectId },

    authorName: { type: String, required: true },
    email:      { type: String, lowercase: true, trim: true },
    rating:     { type: Number, required: true, min: 1, max: 5 },
    title:      { type: String },
    body:       { type: String },
    photos:     { type: [String], default: [] },

    verifiedBuyer: { type: Boolean, default: false },
    status:        { type: String, enum: ["published", "pending", "rejected"], default: "published", index: true },
    helpfulCount:  { type: Number, default: 0 },
    sellerReply:   { body: String, at: Date },

    // AI enrichment (best-effort).
    aiSentiment: { type: String, enum: ["positive", "neutral", "negative"] },
    aiTags:      { type: [String], default: [] },
}, { timestamps: true });

schema.index({ orgId: 1, productId: 1, status: 1, createdAt: -1 });
// One review per signed-in customer per product.
schema.index({ orgId: 1, productId: 1, customerId: 1 }, { unique: true, partialFilterExpression: { customerId: { $exists: true } } });

export default PlatformDB.model("StorefrontReview", schema);
