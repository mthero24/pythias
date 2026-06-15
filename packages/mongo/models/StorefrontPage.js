import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// A seller-created custom/landing page (SEO keyword pages, "about", lookbooks, etc.) rendered
// at the storefront root (/<slug>) using the same section system as the site builder. Separate
// from StorefrontSite.pages so sellers can spin up many keyword pages without touching the
// main site, and so they're independently published + SEO-tuned.
const schema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    slug:  { type: String, required: true, lowercase: true, trim: true },
    title: { type: String, required: true },

    seo: {
        title:       { type: String },
        description: { type: String },
        ogImage:     { type: String },
    },
    keywords: { type: [String], default: [] },   // target SEO keywords (also meta keywords)

    sections: { type: [mongoose.Schema.Types.Mixed], default: [] },  // same shape as StorefrontSite.pages[].sections

    status:      { type: String, enum: ["draft", "published"], default: "draft", index: true },
    publishedAt: { type: Date },
    createdBy:   { type: String },
}, { timestamps: true });

schema.index({ orgId: 1, slug: 1 }, { unique: true });

export default PlatformDB.model("StorefrontPage", schema);
