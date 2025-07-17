import { PremierPrinting } from "../lib/connection";
let mongoose = require("mongoose")
var schema = new mongoose.Schema({
    DTF: {
        quantityDiscounts: [{
            quantity: Number,
            discount: Number
        }],
        price: {type: Number}
    },
    DTG: {
        quantityDiscounts: [{
            quantity: Number,
            discount: Number
        }],
        price: {type: Number}
    },
    EMBROIDERY: {
        quantityDiscounts: [{
            quantity: Number,
            discount: Number
        }],
        price: {type: Number}
    },
})
export default PremierPrinting.model("PrintPricing", schema);