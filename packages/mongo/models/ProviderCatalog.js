import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

// One document per provider × blank × color × size SKU.
// Providers register their offerings here with a wholesale price.
// Commerce Cloud orders are routed only to providers whose catalog
// covers every line item in the order.
const schema = new mongoose.Schema({
    providerId:     { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    blankId:        { type: mongoose.Schema.Types.ObjectId, ref: "Blank", required: true },
    colorId:        { type: mongoose.Schema.Types.ObjectId, ref: "Color", required: true },
    size:           { type: String, required: true },           // e.g. "S", "M", "L", "XL"
    wholesalePrice: { type: Number, required: true },           // in USD cents — what the provider sells the blank for
    retailPrice:    { type: Number },                           // in USD cents — provider's suggested/default retail
    currency:       { type: String, default: "USD" },           // ISO 4217 (for international providers)
    leadTimeDays:   { type: Number, default: 3 },               // estimated days to ship after order received
    active:         { type: Boolean, default: true, index: true },
}, { timestamps: true });

schema.index({ providerId: 1, blankId: 1, colorId: 1, size: 1 }, { unique: true });
schema.index({ blankId: 1, colorId: 1, size: 1, active: 1 }); // routing eligibility lookup

export default PlatformDB.model("ProviderCatalog", schema);
