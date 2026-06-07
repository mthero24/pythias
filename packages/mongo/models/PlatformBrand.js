import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId:       { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    name:        { type: String, required: true },
    description: { type: String },
    logo:        { type: String },
}, { timestamps: true });

schema.index({ orgId: 1, name: 1 });

// Use the existing model if already registered (prevents "Cannot overwrite model" on hot-reload)
export default PlatformDB.models["Brand"] ?? PlatformDB.model("Brand", schema, "brands");
