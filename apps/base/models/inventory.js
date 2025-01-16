const mongoose = require('mongoose');
const {cluster0} = require('../lib/connection');
const Schema = mongoose.Schema;
import Color from "./Color";
import Size from "./Size";
const SchemaObj = new Schema({
    quantity: { type: Number, required: true },
    inventory_id: { type: String, required: true, unique: true },
    barcode_id: { type: String, required: true, unique: true },
    order_at_quantity: { type: Number, required: true },
    pending_quantity: { type: Number, default: 0 },
    desired_order_quantity: { type: Number, required: true },
    color: { type: mongoose.Schema.Types.ObjectId, ref: Color, required: false, autopopulate: true },
    color_name: { type: String, required: true },
    size_name: { type: String, required: true },
    pending_orders: { type: Number, default: 0 },
    unit_cost: {type: Number, default: 0},
    last_counted: Date,
    style_code: String,
    skus: [{
        vendor: String,
        skus: [String]
    }]
});
export default cluster0.model('InventoryV2', SchemaObj, 'inventoryv2');