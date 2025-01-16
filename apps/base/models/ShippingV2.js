const {TSPprints} = require('../lib/connection');
let mongoose = require("mongoose")
var schema = new mongoose.Schema({
    name: {type: String, unique: true},
    base_price: Number,
    estimated_shipping_time: {
        min: Number, 
        max: Number
    },
    upcharge: Number
})
module.exports = TSPprints.model('ShippingV2', schema);