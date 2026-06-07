import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId:       { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    name:        { type: String, required: true },
    description: { type: String },
    logo:        { type: String },
}, { timestamps: true });

schema.index({ orgId: 1, name: 1 });

export default PlatformDB.model("Brand", schema, "brands");
