import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId:                { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    quantity:             { type: Number, required: true, default: 0 },
    inventory_id:         { type: String },
    barcode_id:           { type: String },
    order_at_quantity:    { type: Number, default: 0 },
    pending_quantity:     { type: Number, default: 0 },
    quantity_to_order:    { type: Number, default: 0 },
    desired_order_quantity: { type: Number, default: 0 },
    color:                { type: mongoose.Schema.Types.ObjectId, ref: "PlatformColor" },
    blank:                { type: mongoose.Schema.Types.ObjectId, ref: "PlatformBlank" },
    sizeId:               String,
    color_name:           { type: String },
    size_name:            { type: String },
    pending_orders:       { type: Number, default: 0 },
    unit_cost:            { type: Number, default: 0 },
    location:             String,
    last_counted:         Date,
    style_code:           String,
    skus:                 [{ vendor: String, skus: [String] }],
    row:                  { type: String, default: "0" },
    unit:                 { type: String, default: "0" },
    shelf:                { type: String, default: "0" },
    bin:                  { type: String, default: "0" },
    type:                 { type: String, default: "blank" },
    sku:                  String,
    onhold:               { type: Number, default: 0 },
    allocated:            { type: Number, default: 0 },
    attachedCount:        { type: Number, default: 0 },
    attached:             [String],
    inStock:              [String],
    orders:               [{ order: String, quantity: Number, items: [String] }],
});

schema.index({ orgId: 1, style_code: 1, color_name: 1, size_name: 1 });

export default PlatformDB.model("PlatformInventory", schema);
