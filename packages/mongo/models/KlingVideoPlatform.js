import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId:      { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    taskId:     { type: String, required: true, unique: true },
    productId:  { type: mongoose.Schema.Types.ObjectId, ref: "PlatformProduct" },
    productSku: String,
    month:      { type: Number, required: true },
    year:       { type: Number, required: true },
    cost:       { type: Number, default: 8 },
    createdAt:  { type: Date, default: Date.now, index: true },
});

schema.index({ orgId: 1, month: 1, year: 1 });

export default PlatformDB.model("KlingVideoPlatform", schema);
