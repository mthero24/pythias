const mongoose = require('mongoose');
import { PremierPrinting } from "../lib/connection";
const Schema = mongoose.Schema;
import Color from "./Color";
import Blank from "./Blanks"

const SchemaObj = new Schema({
    quantity: { type: Number, required: true, default: 0 },
    inventory_id: { type: String, required: true, unique: true },
    barcode_id: { type: String, required: true, unique: true },
    order_at_quantity: { type: Number, required: true, default: 0 },
    pending_quantity: { type: Number, default: 0 },
    quantity_to_order: { type: Number, default: 0 },
    desired_order_quantity: { type: Number, required: true },
    color: { type: mongoose.Schema.Types.ObjectId, ref: Color, required: false, autopopulate: true },
    blank: { type: mongoose.Schema.Types.ObjectId, ref: Blank,},
    sizeId: String,
    color_name: { type: String, required: true },
    size_name: { type: String, required: true },
    pending_orders: { type: Number, default: 0 },
    unit_cost: {type: Number, default: 0},
    location: String,
    last_counted: Date,
    style_code: String,
    skus: [{
        vendor: String,
        skus: [String]
    }],
    row: {type: String, default: "0"},
    unit: {type: String, default: "0"},
    shelf: {type: String, default: "0"},
    bin: {type: String, default: "0"},
    type: {type: String, default: "blank"},
    sku: {type: String}, 
    onhold: {type: Number, default: 0},
    attached: [String],
    inStock: [String],
    orders: [
        {
            order: String,
            items:[
                String
            ]
        }
    ]
});
export default PremierPrinting.model("InventoryV2", SchemaObj, "inventoryv2");