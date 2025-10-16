import mongoose from "mongoose"
import { PremierPrinting } from "../lib/connection";
let schema = new mongoose.Schema({
    type: String,
    printType: String,
    cost: {type: Number, default: 0},
})
export default PremierPrinting.model("AdditionalFees", schema);