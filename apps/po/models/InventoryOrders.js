import mongoose from "mongoose"
import {TSPprints} from'../lib/connection';
var schema = new mongoose.Schema({
    orderType: String,
    date: Date,
    name: String,
    vendor: String,
    received: Boolean,
    items: [{
        inventory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'InventoryV2',
        },
        quantity: Number
    }]
})

export const InventoryOrders = TSPprints.model('InventoryOrders', schema);