import mongoose from "mongoose";
import  {PremierPrinting} from '../lib/connection';
import inventory from "./inventory";
import Items from "./Items";
var schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, index: true },
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
    }],
    // SanMar auto-submission
    submittedToSanmar:  { type: Boolean, default: false },
    sanmarPONumber:     { type: String, default: "" },
    sanmarResponse:     { type: String, default: "" },
})

var InventoryOrders = PremierPrinting.model('InventoryOrders', schema);
export default InventoryOrders;