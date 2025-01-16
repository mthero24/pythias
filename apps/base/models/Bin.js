const mongoose= require("mongoose")
const {TSPprints}= require("../lib/connection")
import Order from "./Order"
let schema = new mongoose.Schema({
    number: {type: Number, unique: true},
    order:{ type: mongoose.Schema.Types.ObjectId, ref: Order},
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item"}],
    ready: {type: Boolean, default: false},
    inUse: {type: Boolean, default: false},
    giftWrap: {type: Boolean, default: false},
    wrapped: {type: Boolean, default: false},
    readyToWrap: {type: Boolean, default: false},
    wrapImage: String
})
export default TSPprints.model('Bin', schema);