import mongoose from "mongoose";
import {PremierPrinting} from "../lib/connection";
import Order from "./Order"
let schema = new mongoose.Schema({
    name: {type: String},
    phoneNumber: {type: String},
    email: {type: String},
    companyName: {type: String},
    notes: [{
        date: Date,
        note: String
    }],
    companyDetails: String

})
export default PremierPrinting.model("LicenseHolders", schema);