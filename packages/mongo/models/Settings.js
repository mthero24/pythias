import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
    key:   { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export default PremierPrinting.models.Settings ?? PremierPrinting.model("Settings", schema);
