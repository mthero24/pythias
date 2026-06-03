import mongoose from "mongoose";
import {PremierPrinting} from "../lib/connection";
import Order from "./Order"
let schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, index: true },
    name: {type: String},
    licenseType: {type: String},
    paymentType: {type: String, enum : ["One Time", "FLat Per Unit", 'Percentage Per Unit'], default: 'Percentage Per Unit' },
    amount: {type: Number, default: 0},
    additionalFees: {type: Number, default: 0},

})
export default PremierPrinting.model("LicenseHolders", schema);