const mongoose = require('mongoose');
import { PremierPrinting } from "../lib/connection";
const Schema = mongoose.Schema;
import Color from "./Color";
import Blank from "./Blanks"
import Design from "./Design"
const SchemaObj = new Schema({
    quantity: { type: Number, required: true, default: 0 },
    order_at_quantity: { type: Number, required: true, default: 0 },
    pending_quantity: { type: Number, default: 0 },
    quantity_to_order: { type: Number, default: 0 },
    desired_order_quantity: { type: Number, required: true },
    onHold: {type: Number, default: 0},
    color: { type: mongoose.Schema.Types.ObjectId, ref: Color, },
    blank: { type: mongoose.Schema.Types.ObjectId, ref: Blank,},
    size: { type: mongoose.Schema.Types.ObjectId, },
    design: { type: mongoose.Schema.Types.ObjectId, ref: Design,},
    sizeName: String,
    colorName: String,
    blankCode: String,
    designSku: String,
    unit_cost: {type: Number, default: 0},
    location: String,
    sku: {type: String},
    onHold: {type: Number, default: 0},
    inStock: [String],
    attached: [String],
    delete: { type: Boolean, default: false },
});
export default PremierPrinting.model("ProductInventory", SchemaObj,);