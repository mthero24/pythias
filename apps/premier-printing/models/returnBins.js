const mongoose= require("mongoose")
const { PremierPrinting } = require("../lib/connection");
import Order from "./Order"
let schema = new mongoose.Schema({
    number: {type: Number, unique: true},
    sku: {type: String, unique: true},
    upc: {type:String, unique: true},
    quantity: {type: Number, default: 0}
})
export default PremierPrinting.model("ReturnBin", schema);