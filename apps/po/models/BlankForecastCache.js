import mongoose from "mongoose";
import { TSPprints } from "../lib/connection";

const schema = new mongoose.Schema({
    rows:                 { type: mongoose.Schema.Types.Mixed },
    needsReorderCount:    Number,
    totalSuggestedUnits:  Number,
    totalOrderValue:      Number,
    forecastMonthLabels:  [String],
    computedAt:           { type: Date, default: Date.now },
});

export default TSPprints.model("BlankForecastCache", schema, "blankforecastcache");
