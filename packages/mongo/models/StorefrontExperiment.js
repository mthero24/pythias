import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// An A/B test. Visitors are bucketed into a variant (sticky), exposure + purchase conversions
// are tracked per variant (StorefrontExperimentStat), and the seller can auto-promote the winner.
// v1 goal is always purchase-conversion-rate.
const Variant = new mongoose.Schema({
    key:       { type: String, required: true },   // "A" | "B" | ...
    label:     { type: String },
    weightPct: { type: Number, default: 50 },
    config:    { type: mongoose.Schema.Types.Mixed, default: {} },   // overrides the surface reads (e.g. popup headline)
}, { _id: false });

const schema = new mongoose.Schema({
    orgId:   { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name:    { type: String, required: true },
    // Which surface reads the variant config:
    //  "popup"   → signup popup copy (headline/body/buttonText)
    //  "section" → a specific page section's settings (target identifies which); overrides merge onto its live settings
    //  "sale"    → the site sale/announcement bar offer (message/code/colors)
    //  "hero"/"generic" → legacy config-override surfaces
    type:    { type: String, enum: ["popup", "section", "sale", "hero", "generic"], default: "popup" },
    status:  { type: String, enum: ["running", "stopped"], default: "running", index: true },
    // For "section" tests: which section on which page is under test. Variant A (control) renders the
    // live settings; other variants merge their config onto those settings.
    target:  { pageSlug: { type: String }, sectionId: { type: String } },
    variants: { type: [Variant], default: [] },
    winner:  { type: String },
}, { timestamps: true });

schema.index({ orgId: 1, status: 1 });

export default PlatformDB.model("StorefrontExperiment", schema);
