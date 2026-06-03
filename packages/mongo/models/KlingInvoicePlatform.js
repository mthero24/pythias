import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId:        { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    period:       { type: String, required: true }, // 'YYYY-MM'
    month:        { type: Number, required: true },
    year:         { type: Number, required: true },
    videoCount:   { type: Number, default: 0 },
    totalAmount:  { type: Number, default: 0 },
    ratePerVideo: { type: Number, default: 8 },
    status:       { type: String, enum: ["open", "paid", "invoiced"], default: "open" },
    paidAt:       Date,
}, { timestamps: true });

schema.index({ orgId: 1, period: 1 }, { unique: true });

export default PlatformDB.model("KlingInvoicePlatform", schema);
