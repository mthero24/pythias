import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";
import Design from "./Design"
import Blank from "./Blanks"
import Color from "./Color"
let schema = new mongoose.Schema({
    number: {type: Number, unique: true},
    inventory: [{upc: String, sku: String, quantity: {type: Number, default: 0}, design:  {
        type: mongoose.Schema.Types.ObjectId,
        ref: Design,
    },}],
    design:  {
        type: mongoose.Schema.Types.ObjectId,
        ref: Design,
    },
    blank:  {
        type: mongoose.Schema.Types.ObjectId,
        ref: Blank,
    },
    color:  {
        type: mongoose.Schema.Types.ObjectId,
        ref: Color,
    },
    size: String,
    inUse: {type: Boolean, default: false}
})
export default PremierPrinting.model("ReturnBin", schema);