import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// A "create your own" design a signed-in buyer saved to finish/edit later. We persist the editable
// state — the chosen blank/color/size plus each side's Fabric.js objects (text + placed art with
// their transforms) — so the studio can re-hydrate the canvas exactly as they left it.
const schema = new mongoose.Schema({
    orgId:      { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "StorefrontCustomer", required: true, index: true },
    blankId:    { type: mongoose.Schema.Types.ObjectId, required: true },

    name:       { type: String, default: "Untitled design" },
    styleCode:  { type: String },
    productTitle:{ type: String },
    colorName:  { type: String },
    sizeName:   { type: String },
    thumbnail:  { type: String },   // a front-side preview (best effort)

    // Editable canvas state, keyed by view: { front: [fabricObjJSON…], back: [...] }.
    design:     { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

schema.index({ orgId: 1, customerId: 1, updatedAt: -1 });

export default PlatformDB.model("StorefrontSavedDesign", schema);
