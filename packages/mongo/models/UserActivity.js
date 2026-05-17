import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
    userName:   { type: String, required: true },
    email:      { type: String, default: "" },
    action:     { type: String, required: true }, // blank_create, blank_update, blank_delete, product_create, product_update, product_delete, design_create, design_update, design_delete, order_shipped, order_binned, dtf_sent
    entity:     { type: String, required: true }, // blank, product, design, order, dtf
    entityId:   { type: String, default: "" },
    entityName: { type: String, default: "" },
    provider:   { type: String, default: "premierPrinting" }, // which app
    count:      { type: Number, default: 1 },
    timestamp:  { type: Date, default: Date.now, index: true },
});

schema.index({ userName: 1, timestamp: -1 });
schema.index({ provider: 1, timestamp: -1 });
schema.index({ action: 1, timestamp: -1 });

export default PremierPrinting.model("UserActivity", schema);
