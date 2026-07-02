import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

// A single mixing base an org stocks (e.g. a Wilflex base or any brand's component ink).
// `lab` is the measured/derived CIE-Lab of the base, used for ΔE color matching; `hex` is
// just for on-screen display. Org-scoped like the rest of the platform data.
const schema = new mongoose.Schema(
    {
        orgId: { type: mongoose.Schema.Types.ObjectId, index: true },
        name: { type: String, required: true },
        code: String,
        hex: String,
        lab: { L: Number, a: Number, b: Number },
        costPerGram: { type: Number, default: 0 },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);
schema.index({ orgId: 1, name: 1 });

export default PremierPrinting.models.InkBase || PremierPrinting.model("InkBase", schema);
