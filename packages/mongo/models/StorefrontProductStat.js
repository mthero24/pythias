import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// Per-(org, day, product) rollup powering product analytics: the view → add-to-cart → purchase
// funnel per product. Bounded by products × days; averages/rates computed at read time.
const schema = new mongoose.Schema({
    orgId:     { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    date:      { type: String, required: true },   // YYYY-MM-DD (UTC)
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },

    views:          { type: Number, default: 0 },
    addToCart:      { type: Number, default: 0 },
    purchasedUnits: { type: Number, default: 0 },
}, { timestamps: true });

schema.index({ orgId: 1, date: 1, productId: 1 }, { unique: true });
schema.index({ orgId: 1, date: 1 });

export default PlatformDB.model("StorefrontProductStat", schema);
