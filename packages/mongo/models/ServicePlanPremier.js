import mongoose from "mongoose";
import { PremierPrintingDB } from "../lib/connection";

const schema = new mongoose.Schema({
    appName:      { type: String, required: true },
    description:  { type: String, default: "" },
    monthlyPrice: { type: Number, required: true },
    active:       { type: Boolean, default: true },
    createdAt:    { type: Date, default: Date.now },
    updatedAt:    { type: Date, default: Date.now },
});

schema.index({ appName: 1 }, { unique: true });

export default PremierPrintingDB.model("ServicePlanPremier", schema, "serviceplans_premier");
