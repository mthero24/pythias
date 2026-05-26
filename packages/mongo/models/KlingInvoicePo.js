import mongoose from "mongoose";
import { PremierPrintingDB } from "../lib/connection";

const schema = new mongoose.Schema({
    month:        { type: Number, required: true },
    year:         { type: Number, required: true },
    videoCount:   { type: Number, default: 0 },
    totalAmount:  { type: Number, default: 0 },
    ratePerVideo: { type: Number, default: 8 },
    status:       { type: String, enum: ["open", "paid"], default: "open" },
    paidAt:       Date,
    createdAt:    { type: Date, default: Date.now },
    updatedAt:    { type: Date, default: Date.now },
});

schema.index({ month: 1, year: 1 }, { unique: true });

export default PremierPrintingDB.model("KlingInvoicePo", schema, "klinginvoices_po");
