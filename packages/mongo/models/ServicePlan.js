import mongoose from "mongoose";
import { PremierPrintingDB } from "../lib/connection";

const schema = new mongoose.Schema({
    client: { type: String, default: "premier-printing" },
    appName: { type: String, required: true },
    description: { type: String, default: "" },
    monthlyPrice: { type: Number, required: true },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

schema.index({ client: 1, appName: 1 }, { unique: true });

export default PremierPrintingDB.model("ServicePlan", schema);
