import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const CESaleSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ["scheduled", "active", "ended", "cancelled"],
        default: "scheduled",
        index: true,
    },
    discountType:  { type: String, enum: ["percent", "fixed", "absolute"] },
    discountValue: { type: Number },
    startDate:     { type: Date, index: true },
    endDate:       { type: Date, index: true },
    products: [{
        merchantProductNo: String,
        originalPrice:     Number,
        salePrice:         Number,
        name:              String,
    }],
    channels: [{ id: String, name: String }],  // CE channels this sale applies to (empty = all)
    createdAt:    { type: Date, default: Date.now },
    activatedAt:  { type: Date },
    endedAt:      { type: Date },
    cancelledAt:  { type: Date },
    notes:        { type: String },
});

CESaleSchema.index({ status: 1, startDate: 1 });
CESaleSchema.index({ status: 1, endDate: 1 });

export default PremierPrinting.model("CESale", CESaleSchema, "ce_sales");
