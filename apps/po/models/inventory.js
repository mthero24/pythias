import mongoose from "mongoose";
import { TSPprints }  from "../lib/connection";
const Schema = mongoose.Schema;
import Color from "./Color";
import Size from "./Size";
const SchemaObj = new Schema(
  {
    quantity: { type: Number, required: true },
    inventory_id: { type: String, required: true, unique: true },
    barcode_id: { type: String, required: true, unique: true },
    order_at_quantity: { type: Number, required: true },
    pending_quantity: { type: Number, default: 0 },
    desired_order_quantity: { type: Number, required: true },
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Color,
      required: false,
      autopopulate: true,
    },
    color_name: { type: String, required: true },
    size_name: { type: String, required: true },
    pending_orders: { type: Number, default: 0 },
    unit_cost: { type: Number, default: 0 },
    last_counted: Date,
    style_code: String,
    skus: [
      {
        vendor: String,
        skus: [String],
      },
    ],
    row: {type: String, default: "0"},
    unit: {type: String, default: "0"},
    shelf: {type: String, default: "0"},
    bin: {type: String, default: "0"}
  },
  { suppressWarning: true }
);
export default TSPprints.model('InventoryV2', SchemaObj, 'inventoryv2');