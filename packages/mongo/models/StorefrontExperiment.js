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
    type:    { type: String, enum: ["popup", "hero", "generic"], default: "popup" },   // which surface reads the config
    status:  { type: String, enum: ["running", "stopped"], default: "running", index: true },
    variants: { type: [Variant], default: [] },
    winner:  { type: String },
}, { timestamps: true });

schema.index({ orgId: 1, status: 1 });

export default PlatformDB.model("StorefrontExperiment", schema);
