import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
    appKey:     { type: String, required: true },
    payload:    { type: mongoose.Schema.Types.Mixed },
    computedAt: { type: Date, default: Date.now },
});
schema.index({ appKey: 1 }, { unique: true });

export default PremierPrinting.model("ForecastCache", schema, "forecastcache");
