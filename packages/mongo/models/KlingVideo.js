import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
    taskId: { type: String, required: true, unique: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Products" },
    productSku: String,
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    cost: { type: Number, default: 8 },
    createdAt: { type: Date, default: Date.now, index: true },
});

schema.index({ month: 1, year: 1 });

export default PremierPrinting.model("KlingVideo", schema);
