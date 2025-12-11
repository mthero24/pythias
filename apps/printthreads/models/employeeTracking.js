import mongoose from "mongoose";
import { PremierPrinting }  from "../lib/connection";
import User from "./User"
import Order from "./Order";
import Design from "./Design";
const schema = new mongoose.Schema({
    type: String, //either ship, print, treat, publish, quality, pack, roqship, fold, sublimation, stack
    Date: Date, //date done
    employee: {type: mongoose.Schema.Types.ObjectId, ref: User},
    order: { type: mongoose.Schema.Types.ObjectId, ref: Order },
    pieceID: String,
    printedFront: {type: Boolean, default: false},
    printedBack: {type: Boolean, default: false},
    binNumber: "String",
    design: { type: mongoose.Schema.Types.ObjectId, ref: Design},
    style: String,
});

export default PremierPrinting.model('Employee', schema);