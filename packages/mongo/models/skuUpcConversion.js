import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";
import Color from "./Color";
import Blank from "./Blanks";
import Design from "./Design";
import { Threads } from "openai/resources/beta/threads/threads.mjs";
let schema = new mongoose.Schema({
    sku: {type: String, unique: true, sparse: true},
    upc: {type:String, unique: true, sparse: true},
    color: { type: mongoose.Schema.Types.ObjectId, ref: Color},
    ThreadColor: { type: mongoose.Schema.Types.ObjectId, ref: Threads},
    size: String,
    blank: { type: mongoose.Schema.Types.ObjectId, ref: Blank},
    design: { type: mongoose.Schema.Types.ObjectId, ref: Design},
    gtin: String,
    recycle: {type: Boolean, default: false},
    temp: {type: Boolean, default: false},
    createdAt: { type: Date, default: Date.now },
    hold: { type: Boolean, default: false },
})
export default PremierPrinting.model("SkuToUpc", schema);