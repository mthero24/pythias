import mongoose from "mongoose";
import Color from "./Color"
import Design from "./Design"
const {TSPprints} = require('../lib/connection');


const schema = new mongoose.Schema({
    name: {type: String, required:true},
    date: {
        type: Date,
        default: new Date()
    },
    address: {
        address1: {type: String, default: ''},
        address2: {type: String, default: ''},
        city: {type: String, default: ''},
        state: {type: String, default: ''},
        country: {type: String, default: ''},
        zip: {type: String, default: ''},
    },
    inventory: [{
        sku: String,
        styleV2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StyleV2'
        },
        design: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Design
        },
        color: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Color
        },
        inventory: [{
            sku: String,
            size: String,
            onHand: {type:Number, default: 0},
            wantedOnHand: {type:Number, default: 0},
            reOrder: {type:Number, default: 0},
            price: {type:Number, default: 0},
            automaticReOrder: {type: Boolean, default: false}
        }]
    }],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
});

export default TSPprints.model('Location', schema);
