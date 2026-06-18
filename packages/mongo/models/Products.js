import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";
import Design from "./Design";
import Blank from "./Blanks";
import Color from "./Color";
import MarketPlaces from "./MarketPlaces";
import Inventory from "./inventory"
import ProductInventory from "./ProductInventory"

const schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, index: true },
    design: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Design,
    },
    blanks: [ {
        type: mongoose.Schema.Types.ObjectId,
        ref: Blank,
    }],
    colors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: Color,
    }],
    threadColors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: Color,
    }],
    productImages: [{
        blank: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Blank,
        },
        color: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Color,
        },
        threadColor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Color,
        },
        image: String,
        sku: String,
        side: String
    }],
    variants: Object,
    variantsArray: [{
        image: String,
        images: [String],
        color: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Color,
        },
        size: String,
        sku: String,
        threadColor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Color,
        },
        upc: String,
        blank: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Blank,
        },
        gtin: String,
        ids: Object,
        inventory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Inventory,
        },
        productInventory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: ProductInventory,
        },
        price: Number,
        wholesalePrice: { default: 0, type: Number },
        previousSkus: [String]
    }],
    variantImages: Object,
    variantSecondaryImages: Object,
    defaultColor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Color,
    },
    hasThreadColor: { type: Boolean, default: false },
    sizes: [Object],
    description: String,
    brand: String,
    sku: { type: String},
    title: String,
    slug: { type: String, index: true },   // SEO-friendly product URL (/products/:slug); generated from title per org
    slugAliases: { type: [String], index: true },   // extra lowercased handles that resolve here (old SKU/Shopify handles)

    // Multi-vertical: how this product is fulfilled. Default "pod" (print-on-demand) keeps
    // every existing product unchanged. "dropship" ships from a supplier; "warehouse" is
    // picked/packed from Pythias 3PL stock. One cart can mix all three.
    vertical: { type: String, enum: ["pod", "dropship", "warehouse"], default: "pod" },
    fulfillment: {
        supplierName:  { type: String },
        supplierEmail: { type: String },
        warehouseSku:  { type: String },
    },
    marketPlaces: Object,
    marketPlacesArray: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: MarketPlaces
        }
    ],
    gender: String,
    season: String,
    tags: [String],
    theme: String,
    sportUsedFor: String,
    department: [String],
    category: [String],
    ids: Object,
    isNFProduct: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
    tempImages: [Object],
    marketplaceValues: Object,
    video: String,
    pendingVideoTask: {
        taskId: String,
        musicUrl: String,
    },
    designTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: "DesignTemplate" },
});

// Compound index for efficient paginated listing per org
schema.index({ orgId: 1, _id: -1 });
// Text index for fast title/sku search across large catalogs
schema.index({ title: "text", sku: "text" });

// SEO-friendly product URL slug. Generated from the title on creation (every create() path fires this),
// so new products get a clean /products/<slug> automatically — matching the backfill for existing ones.
const slugifyTitle = (s) => String(s || "").toLowerCase().trim()
    .replace(/['’"]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

schema.pre("save", async function generateSlug(next) {
    try {
        // Always keep the lowercased SKU as an alias so SKU-handle URLs (e.g. Shopify stores that set the
        // handle to the SKU, like Simply Sage's /products/26708bro_f-tswt) resolve directly.
        if (this.sku) {
            const a = String(this.sku).toLowerCase();
            const aliases = this.slugAliases || [];
            if (a && !aliases.includes(a)) this.slugAliases = [...aliases, a];
        }
        if (this.slug || !this.title) return next();
        const base = slugifyTitle(this.title) || String(this._id);
        let slug = base, n = 1;
        // Ensure it's unique within the org (slugs aren't globally unique; products are org-scoped).
        const filter = (s) => ({ slug: s, _id: { $ne: this._id }, ...(this.orgId ? { orgId: this.orgId } : {}) });
        while (await this.constructor.exists(filter(slug))) slug = `${base}-${++n}`;
        this.slug = slug;
        next();
    } catch (e) { next(e); }
});

export default PremierPrinting.model("Products", schema);