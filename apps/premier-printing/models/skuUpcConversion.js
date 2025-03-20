import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";
import Color from "./Color";
import Blank from "./Blanks";
import Design from "./Design";
let schema = new mongoose.Schema({
    sku: {type: String, unique: true},
    upc: {type:String, unique: true},
    color: { type: mongoose.Schema.Types.ObjectId, ref: Color},
    size: String,
    blank: { type: mongoose.Schema.Types.ObjectId, ref: Blank},
    design: { type: mongoose.Schema.Types.ObjectId, ref: Design},
    gtin: String
})
export default PremierPrinting.model("SkuToUpc", schema);