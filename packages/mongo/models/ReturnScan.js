import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
    date:       { type: Date, default: Date.now, index: true },
    sku:        { type: String, index: true },
    upc:        { type: String },
    styleCode:  { type: String, index: true },
    colorName:  { type: String },
    sizeName:   { type: String },
    designSku:  { type: String },
    product:    { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    source:     { type: String },
});

schema.index({ styleCode: 1, colorName: 1, sizeName: 1 });
schema.index({ date: -1, styleCode: 1 });

export default PremierPrinting.model("ReturnScan", schema);
