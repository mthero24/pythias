import mongoose from "mongoose";
import { PlatformDB } from "../lib/connection";

const schema = new mongoose.Schema({
    orgId:          { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name:           { type: String },
    licenseType:    { type: String },
    paymentType:    { type: String, enum: ["One Time", "FLat Per Unit", "Percentage Per Unit"], default: "Percentage Per Unit" },
    amount:         { type: Number, default: 0 },
    additionalFees: { type: Number, default: 0 },
});

schema.index({ orgId: 1, name: 1 });

export default PlatformDB.model("PlatformLicenseHolder", schema);
