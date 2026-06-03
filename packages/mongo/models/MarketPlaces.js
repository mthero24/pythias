import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, index: true },
    name: { type: String, required: true },
    sizeConverter: Object,
    colorFamilyConverter: Object,
    headers: [Object],
    brand: String,
    credentials: Object,
    defaultValues: Object,
    productDefaultValues: Object,
    productDropDowns: Object,
    required: Object,
    hasProductLine: [{ type: Boolean, default: false }],
    disableProductDefaults: [{ type: Boolean, default: false }],
    connections: [String], // Array of connection IDs
    variantTitle: { type: Boolean, default: false },
});

export default PremierPrinting.model("Marketplaces", schema);
