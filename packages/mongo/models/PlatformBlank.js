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
    department: String,
    category: [String],
    subcategory: String,
    vendor: String,
    colors: [{ name: String, hex: String, imageUrl: String }],
    sizes: [{
        name: { type: String, required: true },
        weight: { type: Number, default: 0 },
        wholesaleCost: { type: Number, default: 0 },
        retailPrice: { type: Number, default: 0 },
        sku: String,
    }],
    images: [{ image: String, color: String }],
    printLocations: [{ name: String, code: String, width: Number, height: Number }],
    packageWeight: Number,
    packageLength: Number,
    packageWidth: Number,
    packageHeight: Number,
    handlingTime: { min: Number, max: Number },
}, { timestamps: true });

schema.index({ orgId: 1, code: 1 }, { unique: true });

export default PlatformDB.model("PlatformBlank", schema);
