import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";
import Design from "./Design";
import Blank from "./Blanks";
import Color from "./Color";
import MarketPlaces from "./MarketPlaces";
import Inventory from "./inventory"
import ProductInventory from "./ProductInventory"
import { resolveVariantSize } from "../helpers/variantSize"

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
        compareAtPrice: { default: 0, type: Number },   // "was" price → shows a strikethrough + savings when > price
        wholesalePrice: { default: 0, type: Number },
        costPerItem: { default: 0, type: Number },
        weight: { default: 0, type: Number },
        previousSkus: [String],
        name: String,                        // free-form variant label for catalog (buy-not-build) products
        stock: { type: Number, default: 0 }, // on-hand qty for self-fulfilled catalog products
        supplierVid: String,                 // wholesale supplier variant id (e.g. CJ vid) → auto-reorder
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
    // Buy-not-build catalog products (reseller / commerce-cloud stocked goods that the seller ships themselves).
    isCatalogProduct: { type: Boolean, default: false },
    trackInventory: { type: Boolean, default: false },       // enforce variant.stock at checkout
    continueSellingOOS: { type: Boolean, default: false },   // allow ordering when a variant's stock is 0
    // Wholesale source linkage (Phase 3) — which supplier + product this was imported from, for auto-reorder.
    source: { supplier: String, pid: String },
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
    salePercent: { type: Number, default: 0 },   // per-product sale % off → overrides blank-level compare-at on the storefront

    // Denormalized facet fields for Atlas Search faceting (server-side filter counts + filtering across the
    // whole catalog, not just a page). department/category/brand/tags are already top-level; color/size/price
    // live on variants, so the pre-save hook (+ backfill script) flattens them here as top-level fields.
    facetColors:   { type: [String] },
    facetSizes:    { type: [String] },
    minPriceCents: { type: Number },
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

// Flatten variant-derived facets (color names, sizes, min price) to top-level fields so Atlas Search can
// facet/filter on them. Reads the denormalized v.ids.colorName/sizeName (with a populated color name as a
// fallback) so it works whether or not color refs are populated — matching the storefront card shaper.
export function computeProductFacets(doc) {
    const variants = doc?.variantsArray || [];
    // Color name can live in any of: a populated color ref (.color.name), the stored top-level colorName,
    // or the denormalized ids.colorName. Size is a stored string (or size.name / ids.sizeName).
    const colors = [...new Set(variants.map((v) => v.color?.name || v.colorName || v.ids?.colorName).filter(Boolean))];
    // resolveVariantSize falls back to the blank's sizes ([{_id,name}]) when the variant stored a size _id.
    const sizes  = [...new Set(variants.map((v) => resolveVariantSize(v, v.blank?.sizes)).filter(Boolean))];
    const prices = variants.map((v) => v.price).filter((n) => typeof n === "number" && n > 0);
    return {
        facetColors: colors,
        facetSizes: sizes,
        minPriceCents: prices.length ? Math.round(Math.min(...prices) * 100) : undefined,
    };
}

// Keep the denormalized facet fields in sync on every full-document save. NOTE: this fires on .save()
// (create + doc edits). Bulk updateOne/findOneAndUpdate paths bypass it — those should call
// computeProductFacets() and write the fields themselves (or re-run the backfill).
schema.pre("save", function syncFacets(next) {
    try {
        Object.assign(this, computeProductFacets(this));
        next();
    } catch (e) { next(e); }
});

export default PremierPrinting.model("Products", schema);