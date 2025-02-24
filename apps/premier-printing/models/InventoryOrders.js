import mongoose from "mongoose";
import  {PremierPrinting} from '../lib/connection';
import Blanks from "./Blanks";
var schema = new mongoose.Schema({
    orderType: String,
    date: Date,
    name: String,
    vendor: String,
    received: Boolean,
    items: [{
        inventory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Blanks,
        },
        quantity: Number
    }]
})

var InventoryOrders = PremierPrinting.model('InventoryOrders', schema);
export default InventoryOrders;