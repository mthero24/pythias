import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    tags: [{ type: String }],
    printType: { type: String, default: "DTF" },
    images: { type: Object },
    sublimationImages: { type: Object },
    embroideryFiles: {
        dst: String,
        svg: String,
        preview: String,
    },
    blanks: [{
        blank: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformBlank" },
        colors: [String],
    }],
    published: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    retailPrice: Number,
    cost: Number,
}, { timestamps: true });

schema.index({ orgId: 1, sku: 1 }, { unique: true });

export default PlatformDB.model("PlatformDesign", schema);
