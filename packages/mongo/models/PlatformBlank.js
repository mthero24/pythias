import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    type: { type: String, default: "single" },
    brand: String,
    active: { type: Boolean, default: true },
    description: String,
    slug: String,
    department: String,
    category: [String],
    subcategory: String,
    vendor: String,
    supplier: [String],
    printType: [String],
    hiddenColors: [String],
    colors: [mongoose.Schema.Types.Mixed],
    sizes: [{
        name: { type: String, required: true },
        weight: { type: Number, default: 0 },
        wholesaleCost: { type: Number, default: 0 },
        wholesalePrice: { type: Number, default: 0 },
        retailPrice: { type: Number, default: 0 },
        sku: String,
        hidden: { type: Boolean, default: false },
    }],
    bulletPoints: [{ title: String, description: String }],
    images: [{
        image: String,
        color: String,
        name: String,
        imageGroup: { type: String, default: "default" },
        isModel: { type: Boolean, default: false },
        boxes: { type: mongoose.Schema.Types.Mixed, default: {} },
        sublimationBoxes: { type: mongoose.Schema.Types.Mixed, default: {} },
    }],
    printLocations: [{ name: String, code: String, width: Number, height: Number }],
    sizeGuide: { image: String, images: [String] },
    videos: [String],
    packageWeight: Number,
    packageLength: Number,
    packageWidth: Number,
    packageHeight: Number,
    handlingTime: { min: Number, max: Number },
}, { timestamps: true });

schema.index({ orgId: 1, code: 1 }, { unique: true });

export default PlatformDB.model("PlatformBlank", schema);
