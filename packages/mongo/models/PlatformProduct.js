import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    designRef: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformDesign" },
    blank: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformBlank" },
    title: { type: String, required: true },
    sku: { type: String, required: true },
    description: String,
    brand: String,
    gender: String,
    season: String,
    tags: [String],
    category: [String],
    department: [String],
    active: { type: Boolean, default: true },
    variants: [{
        colorName: String,
        colorHex: String,
        sizeName: String,
        sku: String,
        upc: String,
        price: { type: Number, default: 0 },
        wholesalePrice: { type: Number, default: 0 },
        images: [String],
        active: { type: Boolean, default: true },
    }],
    images: [{ url: String, colorName: String }],
    marketplaces: {
        shopify: { listed: Boolean, listingId: String },
        walmart: { listed: Boolean, listingId: String },
        etsy: { listed: Boolean, listingId: String },
        amazon: { listed: Boolean, listingId: String },
        ebay: { listed: Boolean, listingId: String },
    },
}, { timestamps: true });

schema.index({ orgId: 1, sku: 1 }, { unique: true });
schema.index({ orgId: 1, designRef: 1 });
schema.index({ orgId: 1, active: 1 });

export default PlatformDB.model("PlatformProduct", schema);
