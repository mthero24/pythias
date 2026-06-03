import mongoose from "mongoose";
import { PremierPrinting } from "../lib/connection";

const schema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, index: true },
    appKey:               { type: String, required: true },
    rows:                 { type: mongoose.Schema.Types.Mixed },
    needsReorderCount:    Number,
    totalSuggestedUnits:  Number,
    totalOrderValue:      Number,
    forecastMonthLabels:  [String],
    computedAt:           { type: Date, default: Date.now },
});
schema.index({ appKey: 1 }, { unique: true });

export default PremierPrinting.model("BlankForecastCache", schema, "blankforecastcache");
