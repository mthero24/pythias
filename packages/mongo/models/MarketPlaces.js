import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
    name: { type: String, required: true },
    sizeConverter: Object,
    headers: [Object],
    brand: String,
    credentials: Object,
    defaultValues: Object,
});

export default PremierPrinting.model("Marketplaces", schema);
