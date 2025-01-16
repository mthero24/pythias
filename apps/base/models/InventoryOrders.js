let mongoose = require("mongoose")
const {cluster0} = require('../lib/connection');
const Inventory = require('./inventory')
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

var InventoryOrders = cluster0.model('InventoryOrders', schema);
module.exports = InventoryOrders;