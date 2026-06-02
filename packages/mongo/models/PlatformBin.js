import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    number: { type: String, required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformOrder" },
    status: { type: String, default: "empty" },
    assignedAt: Date,
    clearedAt: Date,
}, { timestamps: true });

schema.index({ orgId: 1, number: 1 }, { unique: true });

export default PlatformDB.model("PlatformBin", schema);
