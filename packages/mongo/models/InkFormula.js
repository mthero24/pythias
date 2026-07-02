import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";
import InkBase from "./InkBase";

// A saved mixing recipe: a set of base components (percent of total) that produces a target
// color. `targetLab` is stored on save so color matching is a cheap ΔE compare (no re-deriving
// from hex each time). Grams are computed at mix time from percent × batch weight.
const componentSchema = new mongoose.Schema(
    {
        base: { type: mongoose.Schema.Types.ObjectId, ref: "InkBase" },
        percent: { type: Number, default: 0 },
    },
    { _id: false }
);

const schema = new mongoose.Schema(
    {
        orgId: { type: mongoose.Schema.Types.ObjectId, index: true },
        name: { type: String, required: true },
        pantone: String,
        targetHex: String,
        targetLab: { L: Number, a: Number, b: Number },
        components: [componentSchema],
        substrate: String,
        notes: String,
    },
    { timestamps: true }
);
schema.index({ orgId: 1, name: 1 });

export default PremierPrinting.models.InkFormula || PremierPrinting.model("InkFormula", schema);
