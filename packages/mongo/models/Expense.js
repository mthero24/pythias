import mongoose from "mongoose";
import { PremierPrintingDB } from "../lib/connection";

const schema = new mongoose.Schema({
    description: { type: String, required: true },
    amount:      { type: Number, required: true },
    category:    { type: String, default: "General" },
    month:       { type: Number, required: true },
    year:        { type: Number, required: true },
    notes:       { type: String, default: "" },
    createdAt:   { type: Date, default: Date.now },
    updatedAt:   { type: Date, default: Date.now },
});

schema.index({ year: 1, month: 1 });

export default PremierPrintingDB.model("Expense", schema, "expenses");
