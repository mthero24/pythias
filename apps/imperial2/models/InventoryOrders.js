import mongoose from "mongoose";
import  {PremierPrinting} from '../lib/connection';
import inventory from "./inventory";
var schema = new mongoose.Schema({
    orderType: String,
    dateOrdered: Date,
    dateExpected: Date,
    poNumber: String,
    vendor: String,
    received: Boolean,
    locations: [{
        name: String,
        received: Boolean,
        items: [{
            inventory: {
                type: mongoose.Schema.Types.ObjectId,
                ref: inventory,
            },
            quantity: Number,
        }]
    }]
})

var InventoryOrders = PremierPrinting.model('InventoryOrders', schema);
export default InventoryOrders;