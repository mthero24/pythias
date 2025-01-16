import mongoose from "mongoose";
import Color from "./Color"
import Design from "./Design"
const {TSPprints} = require('../lib/connection');


const schema = new mongoose.Schema({
    Date: Date,
    items: [
        {
            sku: String,
            quantity: Number,
            price: Number
        }
    ],
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Location",
    },
    itemTotal: Number,
    tax: Number,
    discount: Number,
    paymentType: String,
    transactionId: String,
    transactionFee: Number
});

export default TSPprints.model('PosTransaction', schema);
