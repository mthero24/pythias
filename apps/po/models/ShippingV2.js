import mongoose from "mongoose";
import { TSPprints }  from "../lib/connection";
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