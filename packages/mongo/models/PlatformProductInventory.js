import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId:                  { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    quantity:               { type: Number, default: 0 },
    order_at_quantity:      { type: Number, default: 0 },
    pending_quantity:       { type: Number, default: 0 },
    quantity_to_order:      { type: Number, default: 0 },
    desired_order_quantity: { type: Number, default: 0 },
    onHold:                 { type: Number, default: 0 },
    color:                  { type: mongoose.Schema.Types.ObjectId, ref: "PlatformColor" },
    blank:                  { type: mongoose.Schema.Types.ObjectId, ref: "PlatformBlank" },
    size:                   { type: mongoose.Schema.Types.ObjectId },
    design:                 { type: mongoose.Schema.Types.ObjectId, ref: "PlatformDesign" },
    sizeName:               String,
    colorName:              String,
    blankCode:              String,
    designSku:              String,
    unit_cost:              { type: Number, default: 0 },
    location:               String,
    sku:                    String,
    inStock:                [String],
    attached:               [String],
    delete:                 { type: Boolean, default: false },
});

schema.index({ orgId: 1, sku: 1 });

export default PlatformDB.model("PlatformProductInventory", schema);
