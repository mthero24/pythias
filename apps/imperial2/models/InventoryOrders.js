import mongoose from "mongoose";
import  {PremierPrinting} from '../lib/connection';
import inventory from "./inventory";
import Items from "./Items";
var schema = new mongoose.Schema({
    orderType: String,
    dateOrdered: Date,
    dateExpected: Date,
    poNumber: String,
    vendor: String,
    received: {type: Boolean, default: false},
    locations: [{
        name: String,
        received: {type: Boolean, default: false},
        items: [{
            inventory: {
                type: mongoose.Schema.Types.ObjectId,
                ref: inventory,
            },
            quantity: Number,
        }]
    }],
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: Items,
    }]
})

var InventoryOrders = PremierPrinting.model('InventoryOrders', schema);
export default InventoryOrders;