const mongoose= require("mongoose")
import { PremierPrinting } from "../lib/connection";
import Order from "./Order"
let schema = new mongoose.Schema({
    GTIN: {type: String, unique: true},
    UPC: {type: String, unique: true},
})
export default PremierPrinting.model("AvailableUPC", schema);