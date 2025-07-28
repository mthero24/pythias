import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
    name: { type: String, required: true },
    sizeConverter: Object,
    headers: [Object],
    brand: String,
    credentials: Object,
    defaultValues: Object,
    productDefaultValues: Object,
    hasProductLine: [{ type: Boolean, default: false }],
});

export default PremierPrinting.model("Marketplaces", schema);
