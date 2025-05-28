import mongoose from "mongoose";
import {PremierPrinting} from "../lib/connection";
import Order from "./Order"
let schema = new mongoose.Schema({
    name: {type: String},
    licenseType: {type: String},
    paymentType: {type: String, enum : ["One Time", "FLat Per Unit", 'Percentage Per Unit'], default: 'Percentage Per Unit' },
    amount: {type: Number, default: 0}
})
export default PremierPrinting.model("LicenseHolders", schema);