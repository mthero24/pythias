import mongoose from "mongoose";
import { PremierPrintingDB } from "../lib/connection";

const lineSchema = new mongoose.Schema({
    appName:     { type: String, required: true },
    description: { type: String, default: "" },
    price:       { type: Number, required: true },
}, { _id: false });

const schema = new mongoose.Schema({
    month:       { type: Number, required: true },
    year:        { type: Number, required: true },
    lines:       [lineSchema],
    totalAmount: { type: Number, default: 0 },
    status:      { type: String, enum: ["open", "paid"], default: "open" },
    paidAt:      Date,
    createdAt:   { type: Date, default: Date.now },
    updatedAt:   { type: Date, default: Date.now },
});

schema.index({ month: 1, year: 1 }, { unique: true });

export default PremierPrintingDB.model("ServiceInvoicePo", schema, "serviceinvoices_po");
