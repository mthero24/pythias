import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    designRef: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformDesign" },
    blanks: [{ type: mongoose.Schema.Types.ObjectId, ref: "PlatformBlank" }],
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
    variants: Object,
    variantsArray: [{
        image: String,
        images: [String],
        color: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformColor" },
        colorName: String,
        colorHex: String,
        size: String,
        sku: String,
        upc: String,
        gtin: String,
        blank: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformBlank" },
        inventory: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformInventory" },
        price: { type: Number, default: 0 },
        wholesalePrice: { type: Number, default: 0 },
        active: { type: Boolean, default: true },
        previousSkus: [String],
    }],
    variantImages: mongoose.Schema.Types.Mixed,
    variantSecondaryImages: mongoose.Schema.Types.Mixed,
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
